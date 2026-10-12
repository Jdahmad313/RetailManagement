namespace RetailManagement.Domain.Enums;

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Processing = 2,
    ReadyForPickup = 3,
    OutForDelivery = 4,
    Completed = 5,
    Cancelled = 6,
    Returned = 7
}

public enum PaymentStatus
{
    Pending = 0,
    Authorized = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4
}

public enum PaymentMethodType
{
    Cash = 0,
    Card = 1,
    BankTransfer = 2,
    CashOnDelivery = 3,
    Split = 4
}

public enum InventoryMovementType
{
    OpeningStock = 0,
    PurchaseReceive = 1,
    SaleOrder = 2,
    PosSale = 3,
    ReturnRestock = 4,
    AdjustmentAddition = 5,
    AdjustmentDeduction = 6,
    DamageWriteOff = 7
}

public enum FulfillmentType
{
    Delivery = 0,
    Pickup = 1
}

public enum PurchaseOrderStatus
{
    Draft = 0,
    Ordered = 1,
    PartiallyReceived = 2,
    Received = 3,
    Cancelled = 4
}
