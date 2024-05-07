create database if not exists inventory;
use inventory;


create table if not exists Employee(
	EmployeeID INT PRIMARY KEY AUTO_INCREMENT,
	EmployeeName VarChar(50) NOT NULL,
    Password varchar(50) NOT NULL
    
);


CREATE TABLE if not exists Supplier(
    SupplierId INT PRIMARY KEY auto_increment,
    SupplierName VARCHAR(100) NOT NULL,
	SupplierAddress VARCHAR(255) NOT NULL,
    SupplierNumber numeric(10) NOT NULL,
	SupplierFax numeric(10) NOT NULL,
    SupplierEmail varchar(50) NOT NULL
);


CREATE TABLE if not exists Product (
    ProductID INT PRIMARY KEY auto_increment,
    ProductCode VARCHAR(100) NOT NULL,
    BarCode VARCHAR(100),
    ProductName VARCHAR(200) NOT NULL,
    ProductCategory VARCHAR(200),
    ProductWeight DECIMAL(10, 2),
    PackageDimension VARCHAR(200),
    PackageReady BOOLEAN,
    Refrigerated BOOLEAN,
    PricePerUnit DECIMAL(10, 2)
);



CREATE TABLE if not exists OrderT (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,
	OrderReferenceNo INT Not Null,
    SupplierID INT,
    OrderDate DATE NOT NULL,
    DeliveryDate DATE,
    FOREIGN KEY (SupplierId) REFERENCES Supplier(SupplierID)
);

CREATE TABLE IF NOT EXISTS OrderProducts (
    OrderID INT,
    ProductID INT,
    Quantity INT,
    Price DECIMAL(10, 2),
    FOREIGN KEY (OrderID) REFERENCES OrderT(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

CREATE TABLE IF NOT EXISTS OrderDelivery (
    DeliveryID INT PRIMARY KEY AUTO_INCREMENT,
    OrderID INT,
    DeliveryDate DATE,
    DeliveryStatus Enum('Delivered','Pending') default 'Pending',
    FOREIGN KEY (OrderID) REFERENCES OrderT(OrderID)
);


CREATE TABLE if not exists Inventory (
    ProductID INT,
    inventoryLocation varchar(50),
    WarehouseStockLevel INT NOT NULL DEFAULT 0,
    MinimumStockLevel INT NOT NULL DEFAULT 0,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);


CREATE TABLE if not exists BillT (
    BillingNo INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT,
    BillingDate DATE NOT NULL,
    BillDone bit default 0,
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

CREATE TABLE IF NOT EXISTS BillProducts (
    BillingNo INT,
    ProductID INT,
    Quantity INT,
    Price DECIMAL(10, 2),
    FOREIGN KEY (BillingNo) REFERENCES BillT(BillingNo),
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID)
);

