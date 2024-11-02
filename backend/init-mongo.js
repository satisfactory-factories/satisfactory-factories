db = db.getSiblingDB('factory_planner'); // Switch to or create the database
db.createUser({
  user: 'sf',
  pwd: '12345',
  roles: [{ role: 'readWrite', db: 'factory_planner' }]
});

// Create an initial collection and insert a dummy document
db.createCollection('init_collection'); // Create a collection to force database creation
db.init_collection.insertOne({ initialized: true }); // Insert a dummy document to fully create the database
