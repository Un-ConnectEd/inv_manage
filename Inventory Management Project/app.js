const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors());
app.use(express.static('./html'));
app.use(cookieParser());
app.use(express.json());

const PORT = 8080;

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'inventory',
  multipleStatements: true
});

app.post('/login', (req, res) => {
  const { employeeID, password } = req.body;
  const loginQuery = `Select * from employee where EmployeeID = ?`;
  connection.query(loginQuery, [employeeID], (err, results) => {
    if (err) {
      console.error('Error querying employee:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
  
    if (results.length === 0) {
      res.status(401).json({ error: 'Employee does not exist' });
      return;
    }
  
    const employee = results[0];
    if (employee.Password === password) {
      res.cookie('EmployeeID', employee.EmployeeID, { httpOnly: true, maxAge: new Date(Date.now() + 60 * 60 * 1000) });
      res.json({ employeeID: employee.EmployeeID });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });
});

app.post('/submit-product', (req, res) => {
  const { product_code, product_name, product_category, package_ready, refrigerated, price_per_unit, minimum_stock_level, inventoryLocation } = req.body;

  if (!product_code || !product_name || !price_per_unit || !minimum_stock_level || !inventoryLocation) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
  }

  const productQuery = `INSERT INTO Product (ProductCode, ProductName, ProductCategory, PackageReady, Refrigerated, PricePerUnit) VALUES (?, ?, ?, ?, ?, ?)`;
  connection.query(productQuery, [product_code, product_name, product_category, package_ready, refrigerated, price_per_unit], (err, result) => {
      if (err) {
          console.error('Error inserting product into Product table:', err);
          res.status(500).json({ error: 'Product submission failed' });
          return;
      }

      const productId = result.insertId;

      const inventoryQuery = `INSERT INTO Inventory (ProductID, WarehouseStockLevel, MinimumStockLevel, inventoryLocation) VALUES (?, ?, ?, ?)`;
      connection.query(inventoryQuery, [productId, 0, minimum_stock_level, inventoryLocation], (err) => {
          if (err) {
              console.error('Error inserting inventory data into Inventory table:', err);
              res.status(500).json({ error: 'Product submission failed' });
              return;
          }

          console.log('Product and inventory data inserted successfully');
          res.status(200).json({ message: 'Product submitted successfully' });
      });
  });
});

app.post('/add-supplier', (req, res) => {
  const formData = req.body;

  const query = 'INSERT INTO Supplier (SupplierName, SupplierAddress, SupplierNumber, SupplierFax, SupplierEmail) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [formData.SupplierName, formData.SupplierAddress, formData.SupplierNumber, formData.SupplierFax, formData.SupplierEmail], (err, result) => {
    if (err) {
      console.error('Error adding supplier:', err);
      res.status(500).json({ error: 'Failed to add supplier' });
      return;
    }
    console.log('Supplier added successfully');
    res.status(200).json({ message: 'Supplier added successfully' });
  });
});

app.post('/search-product', (req, res) => {
  const formData = req.body;

  let query;
  let queryParams;
  if (formData.ProductID) {
      query = 'SELECT i.*,p.ProductName FROM inventory i join product p on i.ProductID = p.ProductID WHERE i.ProductID = ?';
      queryParams = [formData.ProductID];
  } else if (formData.ProductName) {
      query = 'SELECT i.*,p.ProductName FROM inventory i join product p on i.ProductID = p.ProductID WHERE i.ProductID IN (SELECT ProductID FROM product WHERE ProductName LIKE ?)';
      queryParams = [`%${formData.ProductName}%`];
  } else {
      res.status(400).json({ error: 'Missing search criteria' });
      return;
  }

  connection.query(query, queryParams, (err, results) => {
      if (err) {
          console.error('Error searching product:', err);
          res.status(500).json({ error: 'Search failed' });
          return;
      }
      
      res.status(200).json(results);
  });
});

app.post('/place-order', (req, res) => {
  const formData = req.body;

  const insertOrderQuery = 'INSERT INTO OrderT (OrderReferenceNo, SupplierID, OrderDate) VALUES (?, ?, ?)';
  const insertOrderParams = [formData.OrderReferenceNo, formData.SupplierID, formData.OrderDate];

  connection.query(insertOrderQuery, insertOrderParams, (err, result) => {
    if (err) {
      console.error('Error placing order:', err);
      res.status(500).json({ error: 'Order placement failed' });
      return;
    }

    const maxOrderIdQuery = 'SELECT MAX(OrderId) AS MaxOrderId FROM OrderT';
  
    connection.query(maxOrderIdQuery, (err, rows) => {
      if (err) {
        console.error('Error retrieving max OrderId:', err);
        res.status(500).json({ error: 'Error retrieving max OrderId' });
        return;
      }

      const maxOrderId = rows[0].MaxOrderId;

      res.cookie('orderId', maxOrderId, { httpOnly: true, maxAge: new Date(Date.now() + 60 * 60 * 1000) });

      console.log('Order placed successfully');
      res.status(200).json({ message: 'Order placed successfully' });
    });
  });
});

app.put('/add-delivery',(req,res)=> {
  const { OrderID } = req.body;
  const query = `update OrderDelivery set DeliveryDate = CURDATE(),DeliveryStatus='Delivered' where OrderID =?`;
  connection.query(query,OrderID,(err,result)=>{
    if (err) {
      console.error('Error registering supplier:', err);
      res.status(500).json({ error: 'Supplier registration failed' });
      return;
  }

  if (err) {
    console.error('Error registering Delivary:', err);
    res.status(500).json({ error: 'Delivary registration failed' });
    return;
}
  console.log('Delivary registered successfully');
  res.status(200).json({ message: 'Delivery registered successfully' });
  });

});
app.post('/register-supplier', (req, res) => {
  const { SupplierName, SupplierAddress, SupplierNumber, SupplierFax, SupplierEmail } = req.body;

  const query = 'INSERT INTO Supplier (SupplierName, SupplierAddress, SupplierNumber, SupplierFax, SupplierEmail) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [SupplierName, SupplierAddress, SupplierNumber, SupplierFax, SupplierEmail], (err, result) => {
      if (err) {
          console.error('Error registering supplier:', err);
          res.status(500).json({ error: 'Supplier registration failed' });
          return;
      }

      console.log('Supplier registered successfully');
      res.status(200).json({ message: 'Supplier registered successfully' });
  });
});

app.post('/place-order-product', (req, res) => {
  const formData = req.body;
  const Id = req.cookies.orderId;

  if (!Id) {
    console.error('Order ID not found in request cookies');
    return res.status(400).json({ error: 'Order ID is required' });
  }

  if (!Array.isArray(formData) || formData.length === 0) {
      console.error('Invalid order product data');
      return res.status(400).json({ error: 'Invalid order product data' });
  }

  const insertQuery = 'INSERT INTO OrderProducts (OrderID, ProductID, Quantity, Price) VALUES ?';
  const values = formData.map(({ productId, quantity, price }) => [Id, productId, quantity, price]);

  connection.query(insertQuery, [values], (err) => {
      if (err) {
          console.error('Error inserting order products:', err);
          return res.status(500).json({ error: 'Order placement failed' });
      }

      console.log('Order products inserted successfully');
      return res.status(200).json({ message: 'Order products inserted successfully' });
  });
});


app.get('/clearAllCookies', (req, res) => {
  const cookies = req.cookies;
  for (const cookie in cookies) {
      res.clearCookie(cookie);
  }
  res.status(200).send('All cookies cleared');
});

app.post('/submit-bill', (req, res) => {
  const employeeId = req.cookies.EmployeeId;

  const insertBillQuery = 'INSERT INTO BillT (EmployeeID, BillingDate) VALUES (?, CURDATE())';
  connection.query(insertBillQuery, [employeeId], (err, result) => {
      if (err) {
          console.error('Error creating bill:', err);
          return res.status(500).json({ error: 'Bill creation failed' });
      }

      const maxBillIdQuery = 'SELECT MAX(BillingNo) AS MaxBillId FROM BillT';
      connection.query(maxBillIdQuery, (err, rows) => {
          if (err) {
              console.error('Error retrieving max BillId:', err);
              return res.status(500).json({ error: 'Error retrieving max BillId' });
          }
          const billingNo = rows[0].MaxBillId;

          res.cookie('BillingNo', billingNo, { httpOnly: true, maxAge: new Date(Date.now() + 60 * 60 * 1000) });

          const insertProductsQuery = 'INSERT INTO BillProducts (BillingNo, ProductID, Quantity) VALUES ?';

          const formData = req.body;

          if (!Array.isArray(formData) || formData.length === 0) {
              console.error('Invalid order product data');
              return res.status(400).json({ error: 'Invalid order product data' });
          }

          const insertValues = formData.map(({ productId, quantity }) => [billingNo, productId, quantity]);

          connection.query(insertProductsQuery, [insertValues], (err) => {
              if (err) {
                  console.error('Error inserting bill products:', err);
                  return res.status(500).json({ error: 'Bill submission failed' });
              }

              return res.status(200).json({ message: 'Bill submitted successfully' });
          });
      });
  });
});

app.post('/restock', (req, res) => {
  const formData = req.body;

  const query = 'SELECT i.*, p.ProductName FROM inventory i JOIN product p ON i.ProductID = p.ProductID WHERE i.WarehouseStockLevel <= i.MinimumStockLevel';

  connection.query(query, (error, results) => {
      if (error) {
          console.error('Error executing SQL query:', error);
          res.status(500).json({ error: 'Internal server error' });
          return;
      }

      res.status(200).json(results);
  });
});

app.get('/check', (req, res) => {
  const employeeId = req.cookies.EmployeeID;
  if (!employeeId) {
      res.status(401).send('Unauthorized');
  } else {
      res.status(200).send('OK');
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

app.listen(PORT, () => {
  console.log('Server is running on port ',PORT)
});
