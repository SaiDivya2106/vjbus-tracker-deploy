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
let superAdminCollectionObj;

// Middleware to get the collection object from the app
adminApp.use((req, res, next) => {
    complaintsCollectionObj = req.app.get('complaintsCollectionObj');
    adminsCollectionObj= req.app.get('adminsCollectionObj');
    superAdminCollectionObj=req.app.get('superAdminCollectionObj');
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


  adminApp.put('/update-status/:complaint_id', verifyGoogleToken, asyncHandler(async (req, res) => {
  const complaintId = req.params.complaint_id;
  const { status, adminEmail } = req.body;

  const validStatuses = ["Pending", "Ongoing", "Resolved"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (!adminEmail) {
    return res.status(400).json({ message: "Admin email is required" });
  }

  // ✅ Step 1: Verify admin
  const admin = await adminsCollectionObj.findOne({ email: adminEmail });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  // ✅ Step 2: Find the complaint
  const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  const userEmail = complaint.user_id; // assuming user's email is stored here
  const complaintTitle = complaint.title;

  // ✅ Step 3: Update complaint status
  const updateResult = await complaintsCollectionObj.updateOne(
    { complaint_id: complaintId },
    { $set: { status } }
  );

  if (updateResult.modifiedCount === 0) {
    return res.status(500).json({ message: "Failed to update status" });
  }

  // ✅ Step 4: Setup email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASS
    }
  });

  // ✅ Step 5: Prepare email content
  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: userEmail,
    subject: `Your Complaint "${complaintTitle}" Status Updated`,
    html: `
      <p>Dear User,</p>
      <p>The status of your complaint titled <strong>"${complaintTitle}"</strong> has been updated to <strong>${status}</strong>.</p>
      <p>This update was made by admin: <strong>${adminEmail}</strong>.</p>
      <p>Thank you for using our Complaint Management System.</p>
      <p>Best regards,<br>Complaint Management Team</p>
    `
  };

  // ✅ Step 6: Send email asynchronously
  transporter.sendMail(mailOptions)
    .then(info => console.log("✅ Status update email sent:", info.response))
    .catch(err => console.error("❌ Error sending status email:", err));

  // ✅ Step 7: Respond immediately
  res.status(200).json({
    message: `Complaint status updated to '${status}' by ${adminEmail}`,
    status
  });
}));



adminApp.delete(
  '/delete-complaint/:complaint_id',
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const complaintId = req.params.complaint_id;
    const { adminEmail } = req.body; // ✅ Take admin email from frontend

    if (!adminEmail) {
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Step 1: Find the complaint by complaint_id
    const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId });

    // Step 2: If not found, return 404
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Step 3: Get user email and title
    const userEmail = complaint.user_id; // assuming this stores user’s email
    const complaintTitle = complaint.title;

    // Step 4: Delete the complaint
    const deleteResult = await complaintsCollectionObj.deleteOne({ complaint_id: complaintId });

    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ message: "Failed to delete complaint" });
    }

    // Step 5: Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS,
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: userEmail,
      subject: `Your Complaint "${complaintTitle}" Has Been Removed`,
      text: `Dear User,\n\nYour complaint titled "${complaintTitle}" has been reviewed and removed by the admin (${adminEmail}).\n\nThank you for using our Complaint Management System.\n\n- Team Thrive`,
    };

    // Step 6: Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Complaint deleted, but failed to send email" });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ message: "Complaint deleted and email sent to user" });
      }
    });
  })
);


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




adminApp.post(
  '/complaints/:id/comment',
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text, adminEmail } = req.body;

    if (!text || !adminEmail) {
      return res.status(400).json({ message: "Comment text and admin email are required" });
    }

    // ✅ Create comment object with role and timestamp (compatible with new structure)
    const comment = {
      id: new Date().getTime(),
      text,
      role: "admin", // Admin comment
      timestamp: new Date().toISOString(),
      email: adminEmail, // Keep for backward compatibility
    };

    // ✅ Add comment to complaint
    const result = await complaintsCollectionObj.updateOne(
      { complaint_id: id },
      { $push: { comments: comment } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Complaint not found or comment could not be added" });
    }

    // ✅ Fetch complaint for email details
    const complaint = await complaintsCollectionObj.findOne({ complaint_id: id });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // ✅ Respond immediately to admin
    res.json({ message: "Comment added successfully" });
    console.log("user email",complaint.user_id)

    // ✅ Send email asynchronously
    setImmediate(async () => {
      try {
        const user = await complaintsCollectionObj.findOne({ user_id: complaint.user_id });
        console.log(user)
        if (!user || !user.user_id) {
          console.warn(`⚠️ No user email found for complaint ${id}`);
          return;
        }

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS,
          },
        });

        const formattedDate = new Date(comment.date).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "long",
          timeStyle: "short",
        });

        const mailOptions = {
          from: process.env.ADMIN_EMAIL,
          to: complaint.user_id,
          subject: `Update on Your Complaint (${complaint.title})`,
          html: `
            <p>Dear User,</p>
            <p>An admin (<strong>${adminEmail}</strong>) has added an update to your complaint titled "<strong>${complaint.title}</strong>".</p>
            <p><strong>Admin Comment:</strong></p>
            <blockquote style="border-left: 4px solid #6a1b9a; padding-left: 10px; color: #333;">
              ${text}
            </blockquote>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p>You can view your complaint and its updates by visiting:</p>
            <p><a href="https://thrive.vjstartup.com" target="_blank" style="
              display: inline-block;
              padding: 8px 16px;
              background-color: #6a1b9a;
              color: white;
              text-decoration: none;
              border-radius: 16px;
              font-weight: 500;
            ">🔍 View Complaint</a></p>
            <p>Best Regards,<br>Complaint Management System</p>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to user (${complaint.user_id}) for complaint: ${complaint.title}`);
      } catch (err) {
        console.error("⚠️ Error sending email to user:", err);
      }
    });
  })
);


// ✅ Check if given email is Super Admin
adminApp.post(
  "/superadmin/check",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const superAdmin = await superAdminCollectionObj.findOne({ email });

    if (!superAdmin) {
      return res.status(403).json({ isSuperAdmin: false, message: "Not a Super Admin" });
    }

    res.json({ isSuperAdmin: true, message: "Super Admin verified" });
  })
);


// ✅ Flag a complaint (without async IIFE)
adminApp.post('/flag-complaint/:id',verifyGoogleToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("params",req.params)
  const { reason, note, flaggedBy } = req.body;

  console.log("Request body:", req.body);

  if (!reason || !flaggedBy) {
    return res.status(400).json({ message: "Reason and flaggedBy are required" });
  }

  // Verify admin email
  const admin = await adminsCollectionObj.findOne({ email: flaggedBy });
  console.log("Admin found:", admin);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  const comp= await complaintsCollectionObj.findOne({ complaint_id: id.toString() });
console.log("Complaint found:", comp);


  // Update complaint with flag details
  const result = await complaintsCollectionObj.updateOne(
    { complaint_id: id.toString()},
    {
      $set: {
        flagged: {
          isFlagged: true,
          reason,
          note: note || "",
          flaggedBy: admin.email,
          flaggedAt: new Date()
        }
      }
    }
  );

  console.log(result)

  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: "Complaint not found or could not be flagged" });
  }

  console.log("Complaint flagged successfully");

  // Fetch complaint after update
  const complaint = await complaintsCollectionObj.findOne({ complaint_id: id });
  const userEmail = complaint.user_id;

  // Fetch all super admins
  const superAdmins = await superAdminCollectionObj.find({}).toArray();
  console.log("Super admins found:", superAdmins);

  if (!superAdmins.length) {
    console.warn("No super admins found to notify.");
    return res.json({ message: "Complaint flagged successfully, but no super admins to notify" });
  }

  const superAdminEmails = superAdmins.map(sa => sa.email);
  console.log("Super admin emails:", superAdminEmails);

  // Send email
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS
      }
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: superAdminEmails,
      subject: `⚠️ Complaint Flagged: "${complaint.title}"`,
      html: `
        <p>Dear Super Admin,</p>
        <p>A complaint has been <b>flagged</b> by admin <b>${admin.name || admin.email}</b>.</p>
        <p><b>Complaint Title:</b> ${complaint.title}</p>
        <p><b>Complaint Description:</b> ${complaint.description}</p>
        <p><b>Flag Reason:</b> ${reason}</p>
        <p><b>Note:</b> ${note || "No extra details"}</p>
        <p><b>Flagged At:</b> ${new Date().toLocaleString()}</p>
        <p>User who raised this complaint: ${userEmail}</p>
        <p>Please review this complaint in the admin dashboard.</p>
        <p>- Complaint Management System</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Flag email sent to Super Admins:", superAdminEmails);
  } catch (error) {
    console.error("❌ Failed to send flag email:", error);
  }

  // Final response
  res.json({ message: "Complaint flagged successfully" });
}));

// Get all flagged complaints (only for Super Admins)
adminApp.post('/superadmin/flagged-complaints', asyncHandler(async (req, res) => {
  const { email } = req.body;

  const superAdmin = await superAdminCollectionObj.findOne({ email });
  if (!superAdmin) return res.status(403).json({ message: "Access denied. Super Admin only." });

  const flaggedComplaints = await complaintsCollectionObj
    .find({ "flagged.isFlagged": true })
    .sort({ "flagged.flaggedAt": -1 })
    .toArray();

  res.json(flaggedComplaints);
}));



// Super Admin takes action on flagged complaint
adminApp.post('/superadmin/complaints/:id/action', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, note, email } = req.body; // ✅ email from req.body

  // ✅ Verify Super Admin
  const superAdmin = await superAdminCollectionObj.findOne({ email });
  if (!superAdmin) {
    return res.status(403).json({ message: "Access denied. Super Admin only." });
  }

  // ✅ Fetch complaint
  const complaint = await complaintsCollectionObj.findOne({ complaint_id: id });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  // ❌ Ensure complaint is flagged before taking action
  if (!complaint.flagged || !complaint.flagged.isFlagged) {
    return res.status(400).json({ message: "Complaint is not flagged. No action required." });
  }

  let updateQuery = {};

  if (action === "valid") {
    // Just unflag and mark as reviewed
    updateQuery = {
      $set: {
        flagged: { isFlagged: false },
        superAdminAction: {
          action: "valid",
          note: note || "",
          reviewedBy: email,
          reviewedAt: new Date()
        }
      }
    };
  } 
  else if (action === "warn") {
    // Unflag and send warning email
    updateQuery = {
      $set: {
        flagged: { isFlagged: false },
        superAdminAction: {
          action: "warn",
          note: note || "",
          reviewedBy: email,
          reviewedAt: new Date()
        }
      }
    };

    // 🔥 Send warning email
    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS
          }
        });

        const mailOptions = {
          from: process.env.ADMIN_EMAIL,
          to: complaint.user_id, // complaint raiser email
          subject: `⚠️ Warning Regarding Your Complaint: "${complaint.title}"`,
          html: `
            <p>Dear User,</p>
            <p>Your complaint titled "<b>${complaint.title}</b>" was flagged and reviewed by the Super Admin.</p>
            <p><b>Action Taken:</b> Warning</p>
            <p><b>Reason/Note:</b> ${note || "No additional details provided"}</p>
            <p>Please raise complaints responsibly.</p>
            <p>- Complaint Management Team</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("⚠️ Warning email sent to:", complaint.user_id);
      } catch (err) {
        console.error("❌ Failed to send warning email:", err);
      }
    })();
  } 
  else {
    return res.status(400).json({ message: "Invalid action. Allowed: valid | warn" });
  }

  // ✅ Update DB
  await complaintsCollectionObj.updateOne({ complaint_id: id }, updateQuery);

  res.json({ message: `Action '${action}' applied successfully by Super Admin` });
}));










// ✅ CHANGE CATEGORY ENDPOINT (escalate/reassign complaint to another category)
adminApp.put(
  '/change-category/:complaint_id',
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const { complaint_id } = req.params;
    const { newCategory, adminEmail } = req.body;

    if (!complaint_id || !newCategory || !adminEmail) {
      return res.status(400).json({ message: "Complaint ID, new category, and admin email are required" });
    }

    // Find complaint
    const complaint = await complaintsCollectionObj.findOne({ complaint_id });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const oldCategory = complaint.category;
    const studentEmail = complaint.user_id;
    const complaintTitle = complaint.title;

    // Verify admin is authorized for old category
    const admin = await adminsCollectionObj.findOne({ email: adminEmail, category: oldCategory });
    if (!admin) {
      return res.status(403).json({ message: "You are not authorized to change this complaint's category" });
    }

    // Update complaint category
    const updateResult = await complaintsCollectionObj.updateOne(
      { complaint_id },
      { $set: { category: newCategory } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to update category" });
    }

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_PASS
      }
    });

    // Email 1: Send to student (Anonymous format with IT details if applicable)
    const isITCategory = newCategory.toLowerCase().includes('it') && newCategory.toLowerCase().includes('network');
    const itDetailsHTML = isITCategory && complaint.it_details ? `
      <p><strong>IT Details:</strong></p>
      <ul>
        ${complaint.it_details.room_number ? `<li><strong>Room Number:</strong> ${complaint.it_details.room_number}</li>` : ''}
        ${complaint.it_details.internet_speed ? `<li><strong>Internet Speed:</strong> ${complaint.it_details.internet_speed}</li>` : ''}
        ${complaint.it_details.issue_duration ? `<li><strong>Issue Duration:</strong> ${complaint.it_details.issue_duration}</li>` : ''}
        ${complaint.it_details.mobile_number ? `<li><strong>Mobile Number:</strong> ${complaint.it_details.mobile_number}</li>` : ''}
      </ul>
    ` : '';
    
    const studentMailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: studentEmail,
      subject: `Complaint Reassigned to ${newCategory}`,
      html: `
        <p>Dear Student,</p>
        <p>Your complaint has been moved to <strong>${newCategory}</strong> by the administration.</p>
        <p><strong>Complaint Title:</strong> ${complaintTitle}</p>
        <p><strong>Complaint ID:</strong> ${complaint_id}</p>
        <p><strong>Previous Department:</strong> ${oldCategory}</p>
        <p><strong>New Department:</strong> ${newCategory}</p>
        ${itDetailsHTML}
        <p>The appropriate team will now review and assist with your request.</p>
        <p>Thank you for your patience.</p>
        <p>Best regards,<br>Complaint Management Team</p>
      `
    };

    // Email 2: Send to new category admin(s) with IT details
    const newCategoryAdmins = await adminsCollectionObj.find({ category: newCategory }).toArray();
    const adminEmails = newCategoryAdmins.map(a => a.email).join(", ");

    const adminITDetailsHTML = isITCategory && complaint.it_details ? `
      <p><strong>IT Details:</strong></p>
      <ul>
        ${complaint.it_details.room_number ? `<li><strong>Room Number:</strong> ${complaint.it_details.room_number}</li>` : ''}
        ${complaint.it_details.internet_speed ? `<li><strong>Internet Speed:</strong> ${complaint.it_details.internet_speed}</li>` : ''}
        ${complaint.it_details.issue_duration ? `<li><strong>Issue Duration:</strong> ${complaint.it_details.issue_duration}</li>` : ''}
        ${complaint.it_details.mobile_number ? `<li><strong>Mobile Number:</strong> ${complaint.it_details.mobile_number}</li>` : ''}
      </ul>
    ` : '';

    const adminMailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: adminEmails,
      subject: `New Complaint Assigned to Your Department: ${complaintTitle}`,
      html: `
        <p>Dear Admin Team,</p>
        <p>A new complaint has been assigned to your department after category change.</p>
        <p><strong>Complaint Details:</strong></p>
        <ul>
          <li><strong>Title:</strong> ${complaintTitle}</li>
          <li><strong>Complaint ID:</strong> ${complaint_id}</li>
          <li><strong>Category:</strong> ${newCategory}</li>
          <li><strong>Previous Category:</strong> ${oldCategory}</li>
          <li><strong>Status:</strong> ${complaint.status}</li>
          <li><strong>Description:</strong> ${complaint.description}</li>
          <li><strong>Submitted on:</strong> ${new Date(complaint.timestamp).toLocaleString()}</li>
          ${complaint.image ? `<li><strong>Image:</strong> <a href="${complaint.image}" target="_blank">View Image</a></li>` : ''}
        </ul>
        ${adminITDetailsHTML}
        <p>Please review and take necessary action.</p>
        <p>Best regards,<br>Complaint Management System</p>
      `
    };

    // Send both emails asynchronously
    transporter.sendMail(studentMailOptions)
      .then(() => console.log("✅ Category change email sent to student"))
      .catch(err => console.error("❌ Error sending student email:", err));

    transporter.sendMail(adminMailOptions)
      .then(() => console.log("✅ New assignment email sent to admin(s)"))
      .catch(err => console.error("❌ Error sending admin email:", err));

    res.status(200).json({
      message: `Complaint category changed from ${oldCategory} to ${newCategory}. Emails sent to student and new category admins.`,
      oldCategory,
      newCategory
    });
  })
);

// ✅ GET REOPENED COMPLAINTS FOR NOTIFICATION
adminApp.get(
  '/get-reopened-complaints',
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const { categories } = req.query;

    if (!categories) {
      return res.status(400).json({
        message: "Categories parameter is required",
      });
    }

    const categoriesArray = Array.isArray(categories)
      ? categories
      : categories.split(",");

    try {
      // Find all Reopened complaints in the admin's categories that have recent comments
      const reopenedComplaints = await complaintsCollectionObj
        .find({
          status: "Reopened",
          category: { $in: categoriesArray },
        })
        .sort({ lastCommentAt: -1 })
        .limit(10)
        .toArray();

      res.status(200).json({
        message: "Reopened complaints retrieved",
        complaints: reopenedComplaints,
      });
    } catch (error) {
      console.error("Error fetching reopened complaints:", error);
      res.status(500).json({ message: "Server error" });
    }
  })
);

module.exports = adminApp;