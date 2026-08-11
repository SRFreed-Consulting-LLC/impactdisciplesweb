export class NumberUtil{
  public static isNumber(value){
    if(Number.isNaN(value)){
      return false
    } else {
      return true;
    }
   }
}
