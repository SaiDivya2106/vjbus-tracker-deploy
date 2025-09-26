const exp = require('express');
const asyncHandler = require('express-async-handler');
const jwt = require("jsonwebtoken"); 
const nodemailer=require("nodemailer");
const verifyGoogleToken = require("../Middleware/verifyGoogleToken");

const adminApp = exp.Router();
adminApp.use(exp.json()); // Middleware to parse JSON

let complaintsCollectionObj;
let adminsCollectionObj;
let flaggedusersCollectionObj;

// Middleware to get the collection object from the app
adminApp.use((req, res, next) => {
    complaintsCollectionObj = req.app.get('complaintsCollectionObj');
    adminsCollectionObj= req.app.get('adminsCollectionObj');
    flaggedusersCollectionObj=req.app.get('flaggedusersCollectionObj')
    next();
});




// adminApp.post("/check-admin",verifyGoogleToken, asyncHandler(async (req, res) => {
//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ message: "Email is required" });
//     }

//     try {
//         // Find admin by email
//         const admin = await adminsCollectionObj.findOne({ email });

//         if (admin) {
//             res.json({ isAdmin: true, adminCategory: admin.category });
//         } else {
//             res.json({ isAdmin: false, adminCategory: null });
//         }
//     } catch (error) {
//         console.error("Error checking admin:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// }));




adminApp.post("/check-admin", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find all admin records with this email
    const adminRecords = await adminsCollectionObj.find({ email }).toArray();

    if (adminRecords.length > 0) {
      const categories = adminRecords.map(a => a.category);
      res.json({ isAdmin: true, adminCategories: categories });
    } else {
      res.json({ isAdmin: false, adminCategories: [] });
    }
  } catch (error) {
    console.error("Error checking admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));




// GET API to view all complaints (sorted by priority)
adminApp.get('/view-complaints',verifyGoogleToken, asyncHandler(async (req, res) => {
    const complaints = await complaintsCollectionObj
        .find()
        .sort({ priority_score: -1, timestamp: -1 })
        .toArray();

    if (complaints.length === 0) {
        return res.status(404).json({ message: "No complaints found" });
    }

    res.status(200).json({ complaints });
}));

//GET Complaint Details by complaint ID
adminApp.get('/view-complaint/:complaintId',verifyGoogleToken, asyncHandler(async (req, res) => {
    const complaintId = req.params.complaintId; // Get complaint ID from request params

    try {
        const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId });

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        res.status(200).json({ complaint });
    } catch (error) {
        console.error("Error fetching complaint:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));


//GET complaints Count
// adminApp.get(
//     "/complaints-count/:category",  // Category is passed as a URL parameter
//     asyncHandler(async (req, res) => {
//       try {
//         // Get category from the URL parameter
//         const { category } = req.params;
  
//         // Fetch counts for each status within the specified category
//         const [pendingCount, resolvedCount, ongoingCount] = await Promise.all([
//           complaintsCollectionObj.countDocuments({ status: "Pending", category }),
//           complaintsCollectionObj.countDocuments({ status: "Resolved", category }),
//           complaintsCollectionObj.countDocuments({ status: "Ongoing", category })
//         ]);
  
//         // Send response with the counts for the given category
//         res.status(200).json({
//           pending: pendingCount,
//           resolved: resolvedCount,
//           ongoing: ongoingCount,
//         });
        
//       } catch (error) {
//         console.error("Error fetching complaint counts:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//       }
//     })
//   );
  



// GET complaints Count (single or multiple categories)
adminApp.get(
  "/complaints-count/:categories", // categories can be single or multiple separated by commas
  asyncHandler(async (req, res) => {
    try {
      // Extract categories from params
      let { categories } = req.params;
      let categoryArray = categories.split(","); // Convert to array

      // Build filter condition
      const filter = categoryArray.length === 1
        ? { category: categoryArray[0] } // Single category
        : { category: { $in: categoryArray } }; // Multiple categories

      // Fetch counts
      const [pendingCount, resolvedCount, ongoingCount] = await Promise.all([
        complaintsCollectionObj.countDocuments({ status: "Pending", ...filter }),
        complaintsCollectionObj.countDocuments({ status: "Resolved", ...filter }),
        complaintsCollectionObj.countDocuments({ status: "Ongoing", ...filter }),
      ]);

      // Send response
      res.status(200).json({
        pending: pendingCount,
        resolved: resolvedCount,
        ongoing: ongoingCount,
      });
    } catch (error) {
      console.error("Error fetching complaint counts:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  })
);


  adminApp.put('/update-status/:complaint_id',verifyGoogleToken, asyncHandler(async (req, res) => {
    const complaintId = req.params.complaint_id;
    const { status } = req.body;

    const validStatuses = ["Pending", "Ongoing", "Resolved"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    // Step 1: Find the complaint
    const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId });

    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    const userEmail = complaint.user_id; // assuming email is stored here
    const complaintTitle = complaint.title;

    // Step 2: Update the status
    const updateResult = await complaintsCollectionObj.updateOne(
        { complaint_id: complaintId },
        { $set: { status } }
    );

    if (updateResult.modifiedCount === 0) {
        return res.status(500).json({ message: "Failed to update status" });
    }

    // Step 3: Setup email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS
        }
    });
    

    // Step 4: Prepare email content
    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: userEmail,
        subject: "Complaint Status Updated",
        text: `Dear User,\n\nThe status of your complaint titled "${complaintTitle}" has been updated to "${status}".\n\nThank you for using our Complaint Management System.\n\n- Admin`
    };

    // Step 5: Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Status updated, but failed to send email" });
        } else {
            console.log("Email sent:", info.response);
            return res.status(200).json({ message: "Status updated and email sent to user", status });
        }
    });
}));


// DELETE API to remove a complaint
adminApp.delete('/delete-complaint/:complaint_id',verifyGoogleToken, asyncHandler(async (req, res) => {
    const complaintId = req.params.complaint_id;

    // Step 1: Find the complaint by complaint_id
    const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId });

    // Step 2: If not found, return 404
    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    // Step 3: Get user email from complaint's user_id field
    const userEmail = complaint.user_id; // assuming this field stores email
    const complaintTitle = complaint.title;

    // Step 4: Delete the complaint
    const deleteResult = await complaintsCollectionObj.deleteOne({ complaint_id: complaintId });

    if (deleteResult.deletedCount === 0) {
        return res.status(500).json({ message: "Failed to delete complaint" });
    }

    // Step 5: Setup Nodemailer for sending email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS
        }
    });

    const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: userEmail,
        subject: "Your Complaint Has Been Removed",
        text: `Dear User,\n\nYour complaint titled "${complaintTitle}" has been reviewed and removed by the admin.\n\nThank you for using our Complaint Management System.\n\n- Admin`
    };

    // Step 6: Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Complaint deleted, but failed to send email" });
        } else {
            console.log("Email sent:", info.response);
            return res.status(200).json({ message: "Complaint deleted and email sent to user" });
        }
    });
}));

// // GET API to filter complaints (Latest first)
// adminApp.get('/filter-complaints',verifyGoogleToken, asyncHandler(async (req, res) => {
//     const { category, status, dateRange } = req.query;

//     let query = {};

//     if (category) {
//         query.category = category;
//     }

//     if (status) {
//         query.status = status;
//     }

//     if (dateRange) {
//         const { startDate, endDate } = getDateRange(dateRange);
//         if (startDate && endDate) {
//             query.timestamp = {
//                 $gte: startDate,
//                 $lte: endDate
//             };
//         }
//     }

//     const complaints = await complaintsCollectionObj
//         .find(query)
//         .sort({ timestamp: -1 })
//         .toArray();

//     // Always return an array, even if empty
//     res.status(200).json({ complaints });
// }));




adminApp.get('/filter-complaints', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { status, category, dateRange } = req.query;

  let query = {};

  // Get logged-in admin categories
  const adminRecords = await adminsCollectionObj.find({ email: req.user.email }).toArray();
  const adminCategories = adminRecords.map(a => a.category);

  // If category param exists AND is valid for this admin, use only that
  if (category && adminCategories.includes(category)) {
    query.category = category; // single category
  } else {
    // Otherwise, fetch all categories assigned to admin
    query.category = { $in: adminCategories };
  }

  if (status) query.status = status;

  if (dateRange) {
    const { startDate, endDate } = getDateRange(dateRange);
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
  }

  const complaints = await complaintsCollectionObj
    .find(query)
    .sort({ timestamp: -1 })
    .toArray();

  res.status(200).json({ complaints });
}));



// Helper function to get the start and end of the week or month
function getDateRange(dateRange) {
    const now = new Date();
    let startDate, endDate;

    if (dateRange === 'weekly') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.setDate(now.getDate() - dayOfWeek));
        endDate = new Date(now.setDate(now.getDate() + (6 - dayOfWeek)));
    } else if (dateRange === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
        return null;
    }

    return { startDate, endDate };
}

// Route to add a comment to a complaint
// adminApp.post('/complaints/:id/comment', asyncHandler(async (req, res) => {
//     const { id } = req.params; // Get complaint ID from URL
//     const { comment } = req.body; // Get the full comment object from request body
   

//     if (!comment || !comment.text) {
//         return res.status(400).json({ message: "Comment cannot be empty" });
//     }

//     const result = await complaintsCollectionObj.updateOne(
//         { complaint_id: id },
//         { $push: { comments: comment } } // Push new comment into the comments array
//     );

//     if (result.modifiedCount > 0) {
//         res.json({ message: "Comment added successfully" });
//     } else {
//         res.status(404).json({ message: "Complaint not found or comment could not be added" });
//     }
// }));




adminApp.post('/complaints/:id/comment',verifyGoogleToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { text, adminEmail } = req.body;

  if (!text || !adminEmail) {
    return res.status(400).json({ message: "Comment text and admin email are required" });
  }

  // ✅ Verify that the email belongs to an admin
  const admin = await adminsCollectionObj.findOne({ email: adminEmail });

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const comment = {
    id: new Date().getTime(),
    text,
    date: new Date().toISOString(),
    email: admin.email   // ✅ Only storing email
  };

  const result = await complaintsCollectionObj.updateOne(
    { complaint_id: id },
    { $push: { comments: comment } }
  );

  if (result.modifiedCount > 0) {
    res.json({ message: "Comment added successfully" });
  } else {
    res.status(404).json({ message: "Complaint not found or comment could not be added" });
  }
}));



module.exports = adminApp;