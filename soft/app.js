const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const cors = require('cors');//add
app.use(cors());//add
// app.use(express.static());
const cookieParser = require('cookie-parser');
const session = require("express-session");
const PORT = 5501;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with the actual user name
  password: 'password', // Replace with the actual password for the user
  database: 'inventory',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);


app.post('/login', (req, res) => {
  const { employeeID, password } = req.body;
  const loginQuery = `Select * from employee where EmployeeID = ?`;
  const employee =   connection.query(loginQuery, [employeeID], (err, result) => {
    if (employee) {
        if(employee.password==password){
          res.cookie('EmployeeID', employee.EmployeeID, { maxAge: 900000, httpOnly: true });
          res.json({ employeeID: employee.EmployeeID });
          res.status(200).send("Authentication successful");

        }
        else {
          res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
        res.status(401).json({ error: 'Employee doesn\'t exists' });
    }
  });
});

app.post('/submit-product', (req, res) => {
  // Extract product data from the request body
  const { product_code, product_name, product_category, package_ready, refrigerated, price_per_unit, minimum_stock_level,inventoryLocation } = req.body;

  // Insert product data into the Product table
  const productQuery = `INSERT INTO Product (ProductCode, ProductName, ProductCategory, PackageReady, Refrigerated, PricePerUnit) VALUES (?, ?, ?, ?, ?, ?)`;
  connection.query(productQuery, [product_code, product_name, product_category, package_ready, refrigerated, price_per_unit], (err, result) => {
      if (err) {
          console.error('Error inserting product into Product table:', err);
          res.status(500).json({ error: 'Product submission failed' });
          return;
      }

      // Get the ID of the newly inserted product
      const productId = result.insertId;

      // Insert inventory data into the Inventory table
      const inventoryQuery = `INSERT INTO Inventory (ProductID, WarehouseStockLevel, MinimumStockLevel,inventoryLocation) VALUES (?, ?, ?,?)`;
      connection.query(inventoryQuery, [productId, 0, minimum_stock_level,inventoryLocation], (err) => {
          if (err) {
              console.error('Error inserting inventory data into Inventory table:', err);
              res.status(500).json({ error: 'Product submission failed' });
              return;
          }

          // Product and inventory data successfully inserted
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

app.get('/search-product', (req, res) => {
  const formData = req.body;

  let query;
  let queryParams;
  if (formData.ProductID) {
      query = 'SELECT * FROM inventory WHERE ProductID = ?';
      queryParams = [formData.ProductID];
  } else if (formData.ProductName) {
      query = 'SELECT * FROM inventory WHERE ProductID IN (SELECT ProductID FROM product WHERE ProductName LIKE ?)';
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

  const query = 'INSERT INTO Orders (OrderReferenceNo, SupplierID, OrderDate) VALUES (?, ?, ?)';
  const queryParams = [formData.OrderReferenceNo, formData.SupplierID, formData.OrderDate];

  const OrderId = result.insertId; 

  res.cookie('orderId', orderId, { maxAge: 3600, httpOnly: true }); 


  connection.query(query, queryParams, (err, result) => {
      if (err) {
          console.error('Error placing order:', err);
          res.status(500).json({ error: 'Order placement failed' });
          return;
      }

      console.log('Order placed successfully');
      res.status(200).json({ message: 'Order placed successfully' });
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


app.post('/place-order', (req, res) => {
  const { orderId } = req.cookies;

  if (!orderId) {
      console.error('Order ID not found in request cookies');
      res.status(400).json({ error: 'Order ID is required' });
      return;
  }

  const { product_id, quantity, price } = req.body;

  if (!product_id || !quantity || !price || product_id.length !== quantity.length || product_id.length !== price.length) {
      console.error('Invalid order product data');
      res.status(400).json({ error: 'Invalid order product data' });
      return;
  }

  const insertQuery = 'INSERT INTO OrderProducts (OrderID, ProductID, Quantity, Price) VALUES (?, ?, ?, ?)';
  const values = [];
  for (let i = 0; i < product_id.length; i++) {
      values.push([orderId, product_id[i], quantity[i], price[i]]);
  }

  connection.query(insertQuery, values, (err) => {
      if (err) {
          console.error('Error inserting order products:', err);
          res.status(500).json({ error: 'Order placement failed' });
          return;
      }

      console.log('Order products inserted successfully');
      res.status(200).json({ message: 'Order products inserted successfully' });
  });
});

// Submit bill with products
app.post('/submit-bill', (req, res) => {
  const { employeeId, product_id, quantity, price } = req.body;

  // Validate product data
  if (!employeeId || !product_id || !quantity || !price ||
      product_id.length !== quantity.length || product_id.length !== price.length) {
      console.error('Invalid product data');
      res.status(400).json({ error: 'Invalid product data' });
      return;
  }

  // Create a new billT entry
  const insertBillQuery = 'INSERT INTO BillT (EmployeeID, BillingDate) VALUES (?, CURDATE())';
  connection.query(insertBillQuery, [employeeId], (err, result) => {
      if (err) {
          console.error('Error creating bill:', err);
          res.status(500).json({ error: 'Bill creation failed' });
          return;
      }

      const billingNo = result.insertId; // Get the ID of the newly inserted bill

      // Insert bill products into the BillProducts table
      const insertProductsQuery = 'INSERT INTO BillProducts (BillingNo, ProductID, Quantity, Price) VALUES (?, ?, ?, ?)';
      const values = [];
      for (let i = 0; i < product_id.length; i++) {
          values.push([billingNo, product_id[i], quantity[i]]);
      }

      connection.query(insertProductsQuery, values, (err) => {
          if (err) {
              console.error('Error inserting bill products:', err);
              res.status(500).json({ error: 'Bill submission failed' });
              return;
          }

          console.log('Bill and bill products inserted successfully');
          res.status(200).json({ message: 'Bill submitted successfully' });
      });
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


