import { EventRegistrationModel } from 'impactdisciplescommon/src/models/domain/event-registration.model';
import { Component, OnInit } from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { AppUser } from 'impactdisciplescommon/src/models/admin/appuser.model';
import { EventModel } from 'impactdisciplescommon/src/models/domain/event.model';
import { CheckoutForm } from 'impactdisciplescommon/src/models/utils/cart.model';
import { EventRegistrationService } from 'impactdisciplescommon/src/services/event-registration.service';
import { EventService } from 'impactdisciplescommon/src/services/event.service';
import { AuthService } from 'impactdisciplescommon/src/services/utils/auth.service';
import { SalesService } from 'impactdisciplescommon/src/services/utils/sales.service';
import { EnumHelper } from 'impactdisciplescommon/src/utils/enum_helper';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, Observable, take } from 'rxjs';
import { LocationService } from 'impactdisciplescommon/src/services/location.service';
import { OrganizationService } from 'impactdisciplescommon/src/services/organization.service';
import { LocationModel } from 'impactdisciplescommon/src/models/domain/location.model';
import { OrganizationModel } from 'impactdisciplescommon/src/models/domain/organization.model';
import { dateFromTimestamp } from 'impactdisciplescommon/src/utils/date-from-timestamp';
import { Address } from 'impactdisciplescommon/src/models/domain/utils/address.model';
import { Phone } from 'impactdisciplescommon/src/models/domain/utils/phone.model';
import { CustomerService } from 'impactdisciplescommon/src/services/admin/customer.service';
import { CustomerModel } from 'impactdisciplescommon/src/models/domain/utils/customer.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit{
  salesDatasource$: Observable<DataSource>;
  eventsRegistrantsDatasource$: Observable<DataSource>;

  public isSalesEditVisible$ = new BehaviorSubject<boolean>(false);
  public isRegistrationEditVisible$ = new BehaviorSubject<boolean>(false);

  selectedPurchase: CheckoutForm;
  selectedEvent: EventModel;

  public states: string[];
  public countries: string[];
  public phoneTypes: string[];
  public events: EventModel[];
  public locations: LocationModel[];
  public organizations: OrganizationModel[];

  isLoggedIn = false;
  loggedInUser: AppUser | CustomerModel;

  phoneEditorOptions = {
    mask: '(X00) 000-0000',
    maskRules: {
      X: /[02-9]/,
    },
    maskInvalidMessage: 'The phone must have a correct phone format',
    valueChangeEvent: 'keyup',
  };

  constructor(private authService: AuthService,
    private customerService: CustomerService,
    public tostrService: ToastrService,
    private salesService: SalesService,
    private eventRegistrationService: EventRegistrationService,
    private eventService: EventService,
    private locationsService: LocationService,
    private organizationsService: OrganizationService
  ){}

  async ngOnInit(): Promise<void> {
    this.states = EnumHelper.getStateRoleTypesAsArray();
    this.countries = EnumHelper.getCountryTypesAsArray();
    this.phoneTypes = EnumHelper.getPhoneTypesAsArray();

    this.authService.getUser().subscribe(user => {
      this.loggedInUser = user;

      if(!this.loggedInUser.shippingAddress){
        this.loggedInUser.shippingAddress = {... new Address()}
      }

      if(!this.loggedInUser.billingAddress){
        this.loggedInUser.billingAddress = {... new Address()}
      }

      if(!this.loggedInUser.phone){
        this.loggedInUser.phone = {... new Phone()}
      }
    });

    this.salesDatasource$ = this.salesService.streamAllByValue("email", this.loggedInUser.email).pipe(
      map(
        (items) =>
          new DataSource({
            reshapeOnPush: true,
            pushAggregationTimeout: 100,
            store: new CustomStore({
              key: 'id',
              loadMode: 'raw',
              load: function (loadOptions: any) {
                return items;
              }
            })
          })
      )
    );

    this.events = await this.eventService.getAll();

    this.eventsRegistrantsDatasource$ = this.eventRegistrationService.streamAllByValue("email", this.loggedInUser.email).pipe(
      map(
        (items) =>
          new DataSource({
            reshapeOnPush: true,
            pushAggregationTimeout: 100,
            store: new CustomStore({
              key: 'id',
              loadMode: 'raw',
              load: function (loadOptions: any) {
                return items;
              }
            })
          })
      )
    );
  }

  save(){
    this.customerService.update(this.loggedInUser.id, this.loggedInUser).then(user => {
      this.authService.setUser(user).pipe(take(1)).subscribe(user => {
        this.tostrService.success(`${user.firstName} ${user.lastName} saved!`)
      })
    });
  }

  showPurchasesEditModal = ({ row: { data } }) => {
    this.selectedPurchase = (Object.assign({}, data));

    this.isSalesEditVisible$.next(true);
  }

  showRegistrationsEditModal = async ({ row: { data } }) => {
    if(!this.organizations){
      this.organizations = await this.organizationsService.getAll();
    }

    if(!this.locations){
      this.locations = await this.locationsService.getAll();
    }

    let registration: EventRegistrationModel = (Object.assign({}, data));

    this.selectedEvent = this.events.find(event => event.id == registration.eventId);
    this.selectedEvent.location = this.locations.find(location => location.id == this.selectedEvent.location);
    this.selectedEvent.organization = this.organizations.find(organization => organization.id == this.selectedEvent.organization);

    this.isRegistrationEditVisible$.next(true);
  }

  getItemTaxableAmount(cartItem){
    return !cartItem.data.isEvent? (cartItem.data.price) * this.selectedPurchase.taxRate : 0;
  }

  getItemShippingAmount(cartItem){
    if(!cartItem.data.isEvent){
      let totalWeight: number;
      try{
      totalWeight = this.selectedPurchase.cartItems.filter(item => item.isEvent == false).map(item => item.weight).reduce((a,b) => a + b);
      } catch (err){
        totalWeight = 0;
      }
      return this.selectedPurchase.shippingRate * (cartItem.data.weight / totalWeight);
    } else {
      return 0;
    }
  }

  getItemTotalAmount(cartItem){
    let totalPrice = cartItem.data.price;
    let shippingAmount = cartItem.data.isEvent? 0 : this.getItemShippingAmount(cartItem);
    let taxAmount = this.getItemTaxableAmount(cartItem)

    let amountToRefund:number  = totalPrice + (shippingAmount? shippingAmount : 0) + (taxAmount ? taxAmount : 0);

    return amountToRefund;
  }

  getOrderRefundedAmount(){
    let refundedItems = this.selectedPurchase.cartItems.filter(item => item.processedStatus == "REFUNDED");
    let totalRefundedList: number[] = refundedItems.map(item => this.getItemTotalAmount({data: item}));

    if(totalRefundedList && totalRefundedList.length > 0){
      return Number(totalRefundedList.reduce((a,b) => a + b).toFixed(2));
    } else {
      return  Number(Number(0).toFixed(0));

    }
  }

  getEventDate(cell){
    return (dateFromTimestamp(this.events.find(event => event.id == cell.data.eventId).startDate) as Date).toDateString()
  }
}
