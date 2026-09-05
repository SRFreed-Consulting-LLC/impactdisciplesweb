// The `customers` document, under this app's older name for it. THE type is
// the shared ContactModel (@impact-common/shared/models/domain/contact.model,
// 2026-09-05); this app carried a four-field CustomerModel of its own, and
// the same document had two shapes with nothing to say which was right. The
// name stays "Customer" here because the collection is still `customers`
// and only the admin's vocabulary moved to Contacts.
export { ContactModel as CustomerModel } from '@impact-common/shared/models/domain/contact.model';
