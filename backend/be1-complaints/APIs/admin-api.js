const exp = require('express');
const asyncHandler = require('express-async-handler');
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");
const verifyGoogleToken = require("../Middleware/verifyGoogleToken");

const adminApp = exp.Router();
adminApp.use(exp.json()); // Middleware to parse JSON

let complaintsCollectionObj;
let adminsCollectionObj;
let flaggedusersCollectionObj;
let superAdminCollectionObj;
let assistantsCollectionObj;

// Middleware to get the collection object from the app
adminApp.use((req, res, next) => {
  complaintsCollectionObj = req.app.get('complaintsCollectionObj');
  adminsCollectionObj = req.app.get('adminsCollectionObj');
  superAdminCollectionObj = req.app.get('superAdminCollectionObj');
  flaggedusersCollectionObj = req.app.get('flaggedusersCollectionObj');
  assistantsCollectionObj = req.app.get('assistantsCollectionObj');
  next();
});




// adminApp.post("/check-admin",verifyGoogleToken, asyncHandler(async (req, res) => {
//     const { email } = req.body;che

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
    // Check if user is an assistant
    const assistant = await assistantsCollectionObj.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    const isAssistant = !!assistant;

    // Find all admin records with this email
    const adminRecords = await adminsCollectionObj.find({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).toArray();

    if (adminRecords.length > 0) {
      const categories = adminRecords.map(a => a.category);
      res.json({ isAdmin: true, adminCategories: categories, isAssistant });
    } else {
      res.json({ isAdmin: false, adminCategories: [], isAssistant });
    }
  } catch (error) {
    console.error("Error checking admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}));




// GET API to view all complaints (sorted by priority)
adminApp.get('/view-complaints', verifyGoogleToken, asyncHandler(async (req, res) => {
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
adminApp.get('/view-complaint/:complaintId', verifyGoogleToken, asyncHandler(async (req, res) => {
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

  // ✅ Step 4: Prepare email content
  const isITCategory = (complaint.category || "").toLowerCase().includes('it') && (complaint.category || "").toLowerCase().includes('network');
  const itDetailsHTML = isITCategory && complaint.it_details ? `
    <p><strong>IT Details:</strong></p>
    <ul>
      ${complaint.it_details.room_number ? `<li><strong>Room Number:</strong> ${complaint.it_details.room_number}</li>` : ''}
      ${complaint.it_details.internet_speed ? `<li><strong>Internet Speed:</strong> ${complaint.it_details.internet_speed}</li>` : ''}
      ${complaint.it_details.issue_duration ? `<li><strong>Issue Duration:</strong> ${complaint.it_details.issue_duration}</li>` : ''}
      ${complaint.it_details.mobile_number ? `<li><strong>Mobile Number:</strong> ${complaint.it_details.mobile_number}</li>` : ''}
    </ul>
  ` : '';

  let mailSubject = `Your Request "${complaintTitle}" Status Updated`;
  let mailHtml = `
    <p>Dear User,</p>
<p>
  The status of your complaint titled 
  <strong style="color:#1e88e5;">"${complaintTitle}"</strong> 
  has been updated to 
  <strong style="color:#2e7d32;">${status}</strong>.
</p>

    <p>This update was made by admin: <strong>${adminEmail}</strong>.</p>
  `;

  if (status === 'Resolved') {
    mailSubject = `Your Complaint "${complaintTitle}" Has Been Resolved`;
    mailHtml = `
    <div style="font-family:Arial, sans-serif; color:#333;">
      <p>Dear User,</p>

      <p>
        We're happy to let you know that your complaint titled 
        <strong style="color:#1e88e5;">"${complaintTitle}"</strong> 
        has been marked as 
        <strong style="color:#fb8c00;">Resolved</strong> 
        by our team.
      </p>

      ${itDetailsHTML}

      <p>
        If you feel the issue is not fully resolved, you may reopen the complaint
        from your complaints page and add a short comment explaining the issue.
        Your feedback will be shared with the admin team anonymously.
      </p>

      <p>
        You can view and manage your complaints here:<br>
        <a 
          href="https://thrive.vjstartup.com/my-complaints"
          style="color:#1e88e5;text-decoration:none;font-weight:bold;"
        >
          https://thrive.vjstartup.com/my-complaints
        </a>
      </p>

      <p>
        Best regards,<br>
        <strong>Complaint Management Team</strong>
      </p>
    </div>
  `;
  } else {
    mailHtml += `
    <p>Thank you for using our Complaint Management System.</p>
    <p>Best regards,<br>Complaint Management Team</p>
  `;
  }


  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: userEmail,
    subject: mailSubject,
    html: mailHtml
  };

  // ✅ Step 5: Send email asynchronously
  sendEmail(mailOptions)
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

    // Step 5: Send email
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: userEmail,
      subject: `Your Request "${complaintTitle}" Has Been Removed`,
      text: `Dear User,\n\nYour request titled "${complaintTitle}" has been reviewed and removed by the admin (${adminEmail}).\n\nThank you for using our Thrive System.\n\n- Team Thrive`,
    };

    // Step 6: Send email
    try {
      const info = await sendEmail(mailOptions);
      console.log("Email sent:", info.response);
      return res.status(200).json({ message: "Complaint deleted and email sent to user" });
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Complaint deleted, but failed to send email" });
    }
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
  const { status, category, dateRange, assignmentFilter } = req.query;

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

  if (assignmentFilter === "AssignedByMe") {
    query.assignedBy = req.user.email;
  } else if (assignmentFilter === "Assigned") {
    query.assignedAssistant = { $exists: true, $ne: null };
  } else if (assignmentFilter === "Unassigned") {
    query.assignedAssistant = { $exists: false }; // or null
  } else if (assignmentFilter && assignmentFilter !== "All") {
    query.assignedAssistant = assignmentFilter; // Matches specific assistant's email
  }

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

    // ✅ Check if user is an assistant and validate assignment
    const assistant = await assistantsCollectionObj.findOne({ email: adminEmail });
    if (assistant) {
      // If commenter is an assistant, verify they're still assigned to this complaint
      const complaint = await complaintsCollectionObj.findOne({ complaint_id: id });
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      
      if (complaint.assignedAssistant && complaint.assignedAssistant !== adminEmail) {
        return res.status(403).json({ 
          message: "Complaint not assigned to you",
          currentAssignee: complaint.assignedAssistant 
        });
      }
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
    console.log("user email", complaint.user_id)

    // ✅ Send email asynchronously
    setImmediate(async () => {
      try {
        const user = await complaintsCollectionObj.findOne({ user_id: complaint.user_id });
        if (!user || !user.user_id) {
          console.warn(`⚠️ No user email found for complaint ${id}`);
          return;
        }

        const formattedDate = new Date(comment.timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "long",
          timeStyle: "short",
        });

        const commenterRoleText = assistant ? "A Team Member" : "An admin";
        const commenterIdent = assistant ? (assistant.name || adminEmail) : adminEmail;

        const mailOptions = {
          from: process.env.ADMIN_EMAIL,
          to: complaint.user_id,
          subject: `Update on Your Request (${complaint.title})`,
          html: `
            <p>Dear User,</p>
            <p>${commenterRoleText} (<strong>${commenterIdent}</strong>) has added an update to your request titled "<strong>${complaint.title}</strong>".</p>
            <p><strong>Comment:</strong></p>
            <blockquote style="border-left: 4px solid #6a1b9a; padding-left: 10px; color: #333;">
              ${text}
            </blockquote>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p>You can view your request and its updates by visiting:</p>
            <p><a href="https://thrive.vjstartup.com" target="_blank" style="
              display: inline-block;
              padding: 8px 16px;
              background-color: #6a1b9a;
              color: white;
              text-decoration: none;
              border-radius: 16px;
              font-weight: 500;
              margin-top: 6px;
            ">🔍 View request</a></p>
            <p>Best Regards,<br>Thrive</p>
          `,
        };

        await sendEmail(mailOptions);
        console.log(`📧 Email sent to user (${complaint.user_id}) for complaint: ${complaint.title}`);

        // ✅ If commented by an assistant, notify the Main Admin
        if (assistant && complaint.assignedBy) {
          const adminMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: complaint.assignedBy,
            subject: `New Comment by Team Member on Request: "${complaint.title}"`,
            html: `
              <p>Dear Admin,</p>
              <p>Team Member <strong>${commenterIdent}</strong> has added a comment to a request you assigned to them.</p>
              <p><strong>Comment:</strong></p>
              <blockquote style="border-left: 4px solid #1e88e5; padding-left: 10px; color: #333;">
                ${text}
              </blockquote>
              <p><strong>Request Title:</strong> ${complaint.title}</p>
              <p><strong>Request ID:</strong> ${complaint.complaint_id}</p>
              <p>You can review this in your Thrive dashboard.</p>
              <p>Best regards,<br>Thrive Team</p>
            `
          };
          await sendEmail(adminMailOptions);
          console.log(`✅ Notification email sent to Main Admin (${complaint.assignedBy}) regarding comment by ${adminEmail}`);
        }

      } catch (err) {
        console.error("⚠️ Error sending email to user or admin:", err);
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
adminApp.post('/flag-complaint/:id', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("params", req.params)
  const { reason, note, flaggedBy } = req.body;

  console.log("Request body:", req.body);

  if (!reason || !flaggedBy) {
    return res.status(400).json({ message: "Reason and flaggedBy are required" });
  }

  // Verify admin or assistant email
  let admin = await adminsCollectionObj.findOne({ email: new RegExp(`^${flaggedBy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  
  if (!admin) {
    admin = await assistantsCollectionObj.findOne({ email: new RegExp(`^${flaggedBy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  }

  console.log("Authorized user found:", admin);
  if (!admin) {
    return res.status(404).json({ message: "Admin or Assistant not found" });
  }
  const comp = await complaintsCollectionObj.findOne({ complaint_id: id.toString() });
  console.log("Complaint found:", comp);


  // Update complaint with flag details
  const result = await complaintsCollectionObj.updateOne(
    { complaint_id: id.toString() },
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
    const isAssistant = await assistantsCollectionObj.findOne({ email: new RegExp(`^${flaggedBy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    const roleText = isAssistant ? "Team Member" : "admin";

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: superAdminEmails,
      subject: `⚠️ Request Flagged by ${roleText}: "${complaint.title}"`,
      html: `
        <p>Dear Super Admin,</p>
        <p>A Request has been <b>flagged</b> by ${roleText} <b>${admin.name || admin.email}</b>.</p>
        <p><b>Request Title:</b> ${complaint.title}</p>
        <p><b>Request Description:</b> ${complaint.description}</p>
        <p><b>Flag Reason:</b> ${reason}</p>
        <p><b>Note:</b> ${note || "No extra details"}</p>
        <p><b>Flagged At:</b> ${new Date().toLocaleString()}</p>
        <p>User who raised this request: ${userEmail}</p>
        <p>Please review this request in the admin dashboard.</p>
        <p>- Thrive</p>
      `
    };

    await sendEmail(mailOptions);
    console.log("✅ Flag email sent to Super Admins:", superAdminEmails);

    // ✅ Notify Main Admin if Assistant flagged it
    if (isAssistant && complaint.assignedBy) {
      const adminMailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: complaint.assignedBy,
        subject: `⚠️ Assigned Request Flagged by Team Member: "${complaint.title}"`,
        html: `
          <p>Dear Admin,</p>
          <p>A Request you assigned has been <b>flagged</b> by Team Member <b>${admin.name || admin.email}</b>.</p>
          <p><b>Request Title:</b> ${complaint.title}</p>
          <p><b>Request ID:</b> ${complaint.complaint_id}</p>
          <p><b>Flag Reason:</b> ${reason}</p>
          <p><b>Note:</b> ${note || "No extra details"}</p>
          <p>Please review this request in your Thrive dashboard.</p>
          <p>- Thrive</p>
        `
      };
      await sendEmail(adminMailOptions);
      console.log("✅ Flag notification sent to Main Admin:", complaint.assignedBy);
    }
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
          subject: `⚠️ Warning Regarding Your Request: "${complaint.title}"`,
          html: `
            <p>Dear User,</p>
            <p>Your request titled "<b>${complaint.title}</b>" was flagged and reviewed by the Super Admin.</p>
            <p><b>Action Taken:</b> Warning</p>
            <p><b>Reason/Note:</b> ${note || "No additional details provided"}</p>
            <p>Please raise requests responsibly.</p>
            <p>- Thrive</p>
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
      subject: `Request Reassigned to ${newCategory}`,
      html: `
        <p>Dear Student,</p>
        <p>Your request has been moved to <strong>${newCategory}</strong> by the administration.</p>
        <p><strong>Request Title:</strong> ${complaintTitle}</p>
        <p><strong>Request ID:</strong> ${complaint_id}</p>
        <p><strong>Previous Department:</strong> ${oldCategory}</p>
        <p><strong>New Department:</strong> ${newCategory}</p>
        ${itDetailsHTML}
        <p>The appropriate team will now review and assist with your request.</p>
        <p>Thank you for your patience.</p>
        <p>Best regards,<br>Thrive Team</p>
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
      subject: `New Request Assigned to Your Department: ${complaintTitle}`,
      html: `
        <p>Dear Admin Team,</p>
        <p>A new request has been assigned to your department after category change.</p>
        <p><strong>Request Details:</strong></p>
        <ul>
          <li><strong>Title:</strong> ${complaintTitle}</li>
          <li><strong>Request ID:</strong> ${complaint_id}</li>
          <li><strong>Category:</strong> ${newCategory}</li>
          <li><strong>Previous Category:</strong> ${oldCategory}</li>
          <li><strong>Status:</strong> ${complaint.status}</li>
          <li><strong>Description:</strong> ${complaint.description}</li>
          <li><strong>Submitted on:</strong> ${new Date(complaint.timestamp).toLocaleString()}</li>
          ${complaint.image ? `<li><strong>Image:</strong> <a href="${complaint.image}" target="_blank">View Image</a></li>` : ''}
        </ul>
        ${adminITDetailsHTML}
        <p>Please review and take necessary action.</p>
        <p>Best regards,<br>Thrive</p>
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
    const { categories, email, isAssistant } = req.query;

    console.log("🔔 Get Reopened Params:", { categories, email, isAssistant });

    let query = {
      status: "Reopened"
    };

    if (isAssistant === "true" && email) {
      // ✅ Assistant: Show only assigned reopened complaints
      query.assignedAssistant = email;
    } else {
      // ✅ Admin: Show reopened complaints in their categories
      if (!categories) {
        return res.status(400).json({
          message: "Categories parameter is required for admins",
        });
      }
      const categoriesArray = Array.isArray(categories) ? categories : categories.split(",");
      query.category = { $in: categoriesArray };
    }

    try {
      console.log("🔔 Executing Reopened Query:", JSON.stringify(query, null, 2));

      // Find all Reopened complaints based on query
      const reopenedComplaints = await complaintsCollectionObj
        .find(query)
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

// -------------------- ASSISTANT MANAGEMENT API --------------------

// ✅ Add Assistant (Admin Only)
adminApp.post('/add-assistant', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { email, name, categories } = req.body;

  if (!email || !categories || !Array.isArray(categories)) {
    return res.status(400).json({ message: "Email and categories are required" });
  }

  const existing = await assistantsCollectionObj.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Assistant already exists" });
  }

  await assistantsCollectionObj.insertOne({
    email,
    name: name || null,
    categories,   // 👈 ARRAY
    createdAt: new Date()
  });

  res.status(201).json({ message: "Assistant added successfully" });
}));


// ✅ Assign Complaint to Assistant (Admin Only)
adminApp.post('/assign-complaint', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaintId, assistantEmail, adminEmail } = req.body;

  if (!complaintId || !assistantEmail || !adminEmail) {
    return res.status(400).json({ message: "Complaint ID, Assistant Email, and Admin Email are required" });
  }

  // Verify Assistant exists
  const assistant = await assistantsCollectionObj.findOne({ email: assistantEmail });
  if (!assistant) {
    return res.status(404).json({ message: "Assistant not found" });
  }

  const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  // Update Complaint
  const result = await complaintsCollectionObj.updateOne(
    { complaint_id: complaintId },
    {
      $set: {
        assignedAssistant: assistantEmail,
        assignedBy: adminEmail,
        assignedAt: new Date()
      }
    }
  );

  if (result.modifiedCount === 0) {
    return res.status(500).json({ message: "Failed to assign complaint" });
  }

  // ✅ Send Email to the Assigned Member
  setImmediate(async () => {
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.ADMIN_EMAIL,
          pass: process.env.ADMIN_PASS
        }
      });
      
      const memberName = assistant.name || "Team Member";

      const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: assistantEmail,
        subject: `New Request Assigned to You: "${complaint.title}"`,
        html: `
          <p>Dear ${memberName},</p>
          <p>A new request has been assigned to you by the Main Admin (<strong>${adminEmail}</strong>).</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li><strong>Title:</strong> ${complaint.title}</li>
            <li><strong>Request ID:</strong> ${complaint.complaint_id}</li>
            <li><strong>Category:</strong> ${complaint.category}</li>
            <li><strong>Description:</strong> ${complaint.description}</li>
          </ul>
          <p>Please review the request in your Thrive Team Dashboard and take the necessary action.</p>
          <p>Best regards,<br>Thrive Team</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Assignment email sent to Team Member (${assistantEmail})`);
    } catch (err) {
      console.error("❌ Failed to send assignment email:", err);
    }
  });

  res.json({ message: `Complaint assigned to ${assistantEmail}` });
}));

// ✅ Get Assigned Complaints (Assistant Only)
adminApp.get('/assistant-complaints', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { email, category, status } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const assistant = await assistantsCollectionObj.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (!assistant) {
    return res.status(403).json({ message: "Access denied. Not an assistant." });
  }

  let query = { assignedAssistant: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  const complaints = await complaintsCollectionObj
    .find(query)
    .sort({ timestamp: -1 })
    .toArray();

  res.json({ complaints });
}));


// ✅ Update Complaint Status (Assistant Only)
adminApp.put('/update-complaint-status-assistant', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaintId, status, remarks, assistantEmail } = req.body;

  if (!complaintId || !status || !assistantEmail) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Verify is assistant
  const isAssistant = await assistantsCollectionObj.findOne({ email: assistantEmail });
  if (!isAssistant) {
    return res.status(403).json({ message: "Access denied. Not an assistant." });
  }

  // Verify complaint is assigned to this assistant
  const complaint = await complaintsCollectionObj.findOne({ complaint_id: complaintId, assignedAssistant: assistantEmail });
  if (!complaint) {
    return res.status(403).json({ message: "Complaint not assigned to you" });
  }
// Get assistant info
const assistant = await assistantsCollectionObj.findOne({ email: assistantEmail });

const updateData = {
  status: status,
  assistantRemarks: remarks || "",  // 🔥 ONLY WHAT ASSISTANT TYPES
  lastUpdatedBy: assistant?.name
    ? `${assistant.name} (${assistantEmail})`
    : assistantEmail,
  lastUpdatedAt: new Date()
};




  // Add remarks to comments array for strict tracking if needed, or just keep as field
if (remarks) {
  const comment = {
    id: new Date().getTime(),
    text: `${assistantEmail} updated status to ${status}. ${remarks}`,
    role: "assistant",
    timestamp: new Date().toISOString(),
    email: assistantEmail
  };

  await complaintsCollectionObj.updateOne(
    { complaint_id: complaintId },
    { $push: { comments: comment } }
  );
}


  const result = await complaintsCollectionObj.updateOne(
    { complaint_id: complaintId },
    { $set: updateData }
  );

  if (result.modifiedCount === 0) {
    return res.status(500).json({ message: "Failed to update status" });
  }

  // ✅ Send email to the Main Admin who assigned this complaint
  const assignedByAdmin = complaint.assignedBy;
  if (assignedByAdmin) {
    setImmediate(async () => {
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_PASS
          }
        });

        const assistantDetails = assistant?.name ? `${assistant.name} (${assistantEmail})` : assistantEmail;
        
        const mailOptions = {
          from: process.env.ADMIN_EMAIL,
          to: assignedByAdmin,
          subject: `Update on Assigned Request: "${complaint.title}"`,
          html: `
            <p>Dear Admin,</p>
            <p>An update has been made to a request you previously assigned to an Team member.</p>
            
            <p><strong>Action performed by:</strong> ${assistantDetails}</p>
            <p><strong>New Status:</strong> ${status}</p>
            <p><strong>Remarks from Team member:</strong></p>
            <blockquote style="border-left: 4px solid #6a1b9a; padding-left: 10px; color: #333;">
              ${remarks || "<em>No remarks provided</em>"}
            </blockquote>
            
            <p><strong>Request Details:</strong></p>
            <ul>
              <li><strong>Title:</strong> ${complaint.title}</li>
              <li><strong>Request ID:</strong> ${complaint.complaint_id}</li>
              <li><strong>Category:</strong> ${complaint.category}</li>
              <li><strong>Description:</strong> ${complaint.description}</li>
            </ul>
            
            <p>You can review these changes in your Thrive dashboard.</p>
            <p>Best regards,<br>Thrive Team</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Update email sent to Main Admin (${assignedByAdmin}) for complaint: ${complaint.title}`);
      } catch (err) {
        console.error("❌ Failed to send update email to main admin:", err);
      }
    });
  }

  res.json({ message: "Status updated successfully" });
}));





// ✅ Get categories of logged-in assistant
adminApp.get('/assistant-categories', verifyGoogleToken, asyncHandler(async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const records = await assistantsCollectionObj.find({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).toArray();

  let allCategories = [];
  records.forEach(r => {
    if (r.category && typeof r.category === "string") {
      allCategories.push(r.category);
    }
    if (r.categories && Array.isArray(r.categories)) {
      allCategories = allCategories.concat(r.categories);
    }
  });

  const uniqueCategories = [...new Set(allCategories)];

  res.json({ categories: uniqueCategories });
}));



adminApp.get("/team-performance/:category", verifyGoogleToken, asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;

    // Get all complaints in this category
    const complaints = await complaintsCollectionObj.find({ category }).toArray();

    const grouped = {};

    complaints.forEach((complaint) => {
      // Skip if not assigned to anyone
      if (!complaint.assignedAssistant) return;

      const email = complaint.assignedAssistant;
      const name = complaint.assignedAssistantName || email.split("@")[0]; // Use name if available

      if (!grouped[email]) {
        grouped[email] = {
          name: name,
          email: email,
          total: 0,
          resolved: 0,
          pending: 0,
          ongoing: 0,
          completionRate: 0,
          lastUpdated: null,
          complaints: []
        };
      }

      grouped[email].total++;
      grouped[email].complaints.push({
        id: complaint.complaint_id,
        title: complaint.title,
        status: complaint.status,
        category: complaint.category,
        timestamp: complaint.timestamp
      });

      // Count by status
      if (complaint.status === "Resolved") {
        grouped[email].resolved++;
      } else if (complaint.status === "Pending") {
        grouped[email].pending++;
      } else if (complaint.status === "Ongoing") {
        grouped[email].ongoing++;
      }

      // Track last update
      if (!grouped[email].lastUpdated || new Date(complaint.lastUpdatedAt) > new Date(grouped[email].lastUpdated)) {
        grouped[email].lastUpdated = complaint.lastUpdatedAt || complaint.timestamp;
      }
    });

    // Calculate completion rate for each assistant
    // Ensure assistants with zero complaints in this category are included
    const assistants = await assistantsCollectionObj.find({ category }).toArray();
    assistants.forEach(a => {
      const email = a.email;
      const name = a.name || a.email.split("@")[0];
      if (!grouped[email]) {
        grouped[email] = {
          name: name,
          email: email,
          total: 0,
          resolved: 0,
          pending: 0,
          ongoing: 0,
          completionRate: 0,
          lastUpdated: null,
          complaints: []
        };
      }
    });

    const result = Object.values(grouped).map(assistant => ({
      ...assistant,
      completionRate: assistant.total > 0 ? Math.round((assistant.resolved / assistant.total) * 100) : 0
    }));

    // Sort by total complaints (descending)
    result.sort((a, b) => b.total - a.total);

    res.json(result);

  } catch (err) {
    console.error("Error fetching team performance:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
}));


adminApp.put("/take-back-complaint", verifyGoogleToken, async (req, res) => {
  const { complaintId } = req.body;

  const complaint = await complaintsCollectionObj.findOne({
    complaint_id: complaintId
  });

  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  // 🔒 Allow only if Pending
  if (complaint.status !== "Pending") {
    return res.status(400).json({
      message: "You can only take back Pending complaints"
    });
  }

  await complaintsCollectionObj.updateOne(
    { complaint_id: complaintId },
    { $set: { assignedAssistant: null } }
  );

  res.json({ message: "Complaint taken back successfully" });
});




adminApp.put("/take-back-complaint", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaintId, adminEmail } = req.body;

  if (!complaintId) {
    return res.status(400).json({ message: "Complaint ID required" });
  }

  const complaint = await complaintsCollectionObj.findOne({
    complaint_id: complaintId
  });

  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  if (complaint.status !== "Pending") {
    return res.status(400).json({
      message: "You can only take back Pending complaints"
    });
  }

  await complaintsCollectionObj.updateOne(
    { complaint_id: complaintId },
    {
      $set: {
        assignedAssistant: null,
        assignedBy: null,
        lastUpdatedBy: adminEmail,
        assignedAt: null
      }
    }
  );

  res.json({ message: "Complaint taken back successfully" });
}));






// ✅ Get All Assistants (Admin Only)
adminApp.get('/all-assistants', verifyGoogleToken, asyncHandler(async (req, res) => {
  const assistants = await assistantsCollectionObj.find().toArray();

  // Calculate detailed workload counts for each assistant
  const assistantsWithWorkload = await Promise.all(
    assistants.map(async (assistant) => {
      const [pendingCount, ongoingCount, resolvedCount, reopenedCount] = await Promise.all([
        complaintsCollectionObj.countDocuments({ assignedAssistant: assistant.email, status: /^Pending$/i }),
        complaintsCollectionObj.countDocuments({ assignedAssistant: assistant.email, status: /^Ongoing$/i }),
        complaintsCollectionObj.countDocuments({ assignedAssistant: assistant.email, status: /^Resolved$/i }),
        complaintsCollectionObj.countDocuments({ assignedAssistant: assistant.email, status: /^Reopened$/i })
      ]);

      return {
        ...assistant,
        activeComplaints: pendingCount + ongoingCount + reopenedCount,
        pendingCount,
        ongoingCount,
        resolvedCount,
        reopenedCount
      };
    })
  );

  res.json({ assistants: assistantsWithWorkload });
}));

module.exports = adminApp;