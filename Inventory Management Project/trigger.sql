
DELIMITER $$
CREATE TRIGGER deli
AFTER INSERT ON ordert
FOR EACH ROW
BEGIN
    INSERT INTO orderdelivery (OrderID) VALUES (NEW.OrderID);
END$$
DELIMITER ;


DELIMITER $$
CREATE TRIGGER ProDel
AFTER UPDATE ON orderdelivery
FOR EACH ROW
BEGIN
    DECLARE proId INT;
    DECLARE OrdId INT;
    DECLARE nos INT;
    DECLARE done INT DEFAULT 0;
    DECLARE cur CURSOR FOR
        SELECT ProductID, OrderID
        FROM orderproducts
        WHERE OrderID = NEW.OrderID;
	
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    IF NEW.DeliveryStatus = 'Delivered' THEN
        OPEN cur;
        read_loop: LOOP
            FETCH cur INTO proId, OrdId;
            IF done THEN
                LEAVE read_loop;
            END IF;
            SET nos = (SELECT Quantity FROM orderproducts WHERE ProductID = proId AND OrderID = OrdId);
            UPDATE inventory SET WarehouseStockLevel = WarehouseStockLevel + nos WHERE ProductID = proId;
        END LOOP;
        CLOSE cur;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER ProBill
AFTER insert ON billproducts
FOR EACH ROW
BEGIN
    if New.insert = 1 then
        UPDATE inventory SET WarehouseStockLevel = (WarehouseStockLevel - NEW.Quantity) WHERE ProductID = NEW.ProductID;
    end if;
END$$
DELIMITER ;






