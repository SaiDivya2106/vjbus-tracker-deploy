const { MongoClient } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017').then(async client => {
  try {
    const db = client.db('complaints-dev');
    
    // Fix assistant collection typo
    const result1 = await db.collection('assistantCollection').updateOne(
      { email: '22071a190@vnrvjiet.in' },
      { $set: { email: '22071a1290@vnrvjiet.in' } }
    );
    console.log(`Updated ${result1.modifiedCount} records in assistantCollection.`);

    // Also fix any already-assigned complaints that got the bad email...
    const result2 = await db.collection('complaintsCollection').updateMany(
      { assignedAssistant: '22071a190@vnrvjiet.in' },
      { $set: { assignedAssistant: '22071a1290@vnrvjiet.in' } }
    );
    console.log(`Fixed ${result2.modifiedCount} assigned complaints.`);

  } catch (err) {
    console.error(err);
  } finally {
    client.close();
  }
});
