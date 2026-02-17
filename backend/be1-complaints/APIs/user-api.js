const exp = require("express");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const axios = require("axios");
const bodyParser = require("body-parser");
const Sentiment = require("sentiment");
const natural = require("natural");
const validWords = new Set(require("an-array-of-english-words"));
const sentiment = new Sentiment();
const nodemailer = require("nodemailer");
const verifyGoogleToken = require("../Middleware/verifyGoogleToken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// -------------------- MULTER (memory storage) --------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------------------- Cloudinary Config --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

dotenv.config();

const userApp = exp.Router();
userApp.use(exp.json());

let complaintsCollectionObj;
let adminsCollectionObj;

// Middleware to get the collection object from the app and fail-fast if missing
userApp.use((req, res, next) => {
  complaintsCollectionObj = req.app.get("complaintsCollectionObj");
  adminsCollectionObj = req.app.get("adminsCollectionObj");

  if (!complaintsCollectionObj || !adminsCollectionObj) {
    // Log useful debug info and return a 503 so handlers don't throw
    console.error('DB collections not available on app object', {
      complaintsCollectionObj: !!complaintsCollectionObj,
      adminsCollectionObj: !!adminsCollectionObj,
      path: req.originalUrl,
      method: req.method,
    });
    return res.status(503).json({ error: 'Service unavailable: database not connected' });
  }

  next();
});

// -------------------- Utility Functions --------------------
function containsOffensiveLanguage(text) {
  const offensiveWords = [
    "offensive", "abusive", "hate", "stupid", "fuck", "shit",
    "idiot", "bastard", "bloody",
  ];
  return offensiveWords.some((word) => text.toLowerCase().includes(word));
}

function isMeaninglessComplaint(text) {
  if (!text || typeof text !== "string") return true;

  const cleaned = text.trim().toLowerCase();

  if (cleaned.length < 10) return true;
  if (/(.)\1{3,}/.test(cleaned)) return true;
  if (!cleaned.includes(" ") && !validWords.has(cleaned)) return true;

  const symbolRatio = (cleaned.match(/[^a-z\s]/gi) || []).length / cleaned.length;
  if (symbolRatio > 0.3) return true;

  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(cleaned);
  if (words.length === 0) return true;

  const meaningful = words.filter(
    (w) => validWords.has(w) && !natural.stopwords.includes(w)
  );

  const ratio = meaningful.length / words.length;
  if (meaningful.length < 2 || ratio < 0.3) return true;

  return false;
}

// -------------------- ADD COMPLAINT --------------------
userApp.post(
  "/add-complaint",
  asyncHandler(async (req, res) => {
    const {
      complaint_id,
      title,
      description,
      category,
      user_id,
      github_issue,
      image,
      it_details,
    } = req.body;

    if (!complaint_id || !title || !description || !category || !user_id) {
      return res.status(400).json({
        message: "Complaint ID, title, description, category, and user ID are required",
      });
    }

    // Determine if this complaint belongs to IT & Networking (case-insensitive)
    const normalizedCategory = typeof category === "string" ? category.trim().toLowerCase() : "";
    const isITCategory = [
      "it and networking",
      "it & networking",
      "it networking",
      "it/networking",
    ].includes(normalizedCategory);

    // If IT category, validate location and connectionType are required
    if (isITCategory) {
      if (!it_details || !it_details.location || !it_details.connectionType) {
        return res.status(400).json({
          message: "Location and Connection Type are required for IT & Networking complaints",
        });
      }

      // Only require room_number, internet_speed, mobile_number, issue_duration if NOT WiFi at hostel
      const isHostel = it_details.location === "Boys Hostel" || it_details.location === "Girls Hostel";
      const isWiFi = it_details.connectionType === "WiFi";
      const isWiFiAtHostel = isHostel && isWiFi;

      if (!isWiFiAtHostel) {
        if (!it_details.room_number || !it_details.internet_speed || !it_details.mobile_number || !it_details.issue_duration) {
          return res.status(400).json({
            message:
              "For IT and Networking complaints (non-WiFi at hostel), `room_number`, `internet_speed`, `mobile_number` and `issue_duration` are required",
          });
        }
      }
    }

    const result = sentiment.analyze(description);

    if (result.score < -3 || containsOffensiveLanguage(description)) {
      return res.status(400).json({
        message: "Your complaint contains offensive or abusive language. Please revise it.",
        score: result.score,
      });
    }

    if (isMeaninglessComplaint(title) || isMeaninglessComplaint(description)) {
      return res.status(400).json({
        message: "Your complaint seems meaningless. Please provide a valid title and description.",
      });
    }

    const newComplaint = {
      complaint_id,
      title,
      description,
      category,
      user_id,
      github_issue: github_issue || null,
      image: image || null,
      // Only add IT-specific details when category is IT & Networking
      ...(isITCategory && it_details
        ? {
            it_details,
          }
        : {}),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      status: "Pending",
      comments: [],
      flagged: false,
      votedUsers: [],
    };

    try {
      const resultInsert = await complaintsCollectionObj.insertOne(newComplaint);

      if (resultInsert.acknowledged) {
        // 👇 Format timestamp
        const formattedTimestamp = new Date(newComplaint.timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "long",
          timeStyle: "short",
        });

        // 👇 Immediately send response to frontend
        const { user_id, ...complaintWithoutUserId } = newComplaint;
        res.status(201).json({
          message: "Complaint added successfully. Admins will be notified shortly.",
          complaint: complaintWithoutUserId,
        });

        // 👇 Run email sending asynchronously (non-blocking)
        setImmediate(async () => {
          try {
            const admins = await adminsCollectionObj.find({ category }).toArray();
            if (admins.length > 0) {
              const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.ADMIN_EMAIL,
                  pass: process.env.ADMIN_PASS,
                },
              });

              const mailPromises = admins.map((admin) => {
                const mailOptions = {
                  from: process.env.ADMIN_EMAIL,
                  to: admin.email,
                  subject: `New Request: ${title} in ${category}`,
                  html: `
                    <p>Dear Admin,</p>
                    <p>A new request has been submitted in your assigned category: <strong>${category}</strong>.</p>
                    <p><strong>Request Details:</strong></p>
                    <ul>
                      <li><strong>Title:</strong> ${title}</li>
                      <li><strong>Description:</strong> ${description}</li>
                      <li><strong>Request ID:</strong> ${complaint_id}</li>
                      <li><strong>Status:</strong> Pending</li>
                      <li><strong>Submitted on:</strong> ${formattedTimestamp}</li>
                      ${isITCategory ? `
                        <li><strong>Room Number:</strong> ${room_number}</li>
                        <li><strong>Internet Speed:</strong> ${internet_speed}</li>
                        <li><strong>Mobile Number:</strong> ${mobile_number}</li>
                        <li><strong>Issue Duration:</strong> ${issue_duration}</li>
                      ` : ''}
                      ${
                        image
                          ? `<li><strong>Image:</strong><br>
                              <a href="${image}" 
                                 target="_blank" 
                                 style="
                                   display: inline-block;
                                   padding: 8px 16px;
                                   background-color: #3b7abeff;
                                   color: white;
                                   text-decoration: none;
                                   border-radius: 16px;
                                   font-weight: 500;
                                   margin-top: 6px;
                                 ">
                                📷 Click to View Image
                              </a>
                             </li>`
                          : ""
                      }
                    </ul>
                    <p><a href="https://thrive.vjstartup.com">View and manage the request</a></p>
                    <p>Please take action as soon as possible.</p>
                    <p>Regards,<br>Thrive</p>
                  `,
                };
                return transporter.sendMail(mailOptions);
              });

              await Promise.all(mailPromises);
              console.log(`✅ Emails sent to ${admins.length} admins for category: ${category}`);
            }
          } catch (err) {
            console.error("⚠️ Error sending admin emails:", err);
          }
        });
      } else {
        res.status(500).json({ message: "Failed to add complaint" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Database error or email error" });
    }
  })
);

// -------------------- GET COMPLAINT SUMMARY --------------------
userApp.get("/complaints/summary", verifyGoogleToken, async (req, res) => {
  try {
    const allComplaints = await complaintsCollectionObj.find().toArray();

    const summary = {
      total: allComplaints.length,
      resolved: 0,
      pending: 0,
      ongoing: 0,
      categories: {},
      topCategory: null,
    };

    allComplaints.forEach((comp) => {
      const status = comp.status;
      const category = comp.category;

      if (status === "Resolved") summary.resolved++;
      else if (status === "Pending") summary.pending++;
      else if (status === "Ongoing") summary.ongoing++;

      if (!summary.categories[category]) {
        summary.categories[category] = { category, total: 0, resolved: 0, pending: 0, ongoing: 0, resolvedPercentage: 0 };
      }

      summary.categories[category].total++;
      summary.categories[category][status.toLowerCase()]++;
    });

    Object.values(summary.categories).forEach((cat) => {
      if (cat.total > 0) cat.resolvedPercentage = Math.round((cat.resolved / cat.total) * 100);
    });

    let topPercentage = 0;
    Object.values(summary.categories).forEach((cat) => {
      if (cat.resolvedPercentage > topPercentage) {
        topPercentage = cat.resolvedPercentage;
        summary.topCategory = cat.category;
      }
    });

    res.json(summary);
  } catch (error) {
    console.error("Error fetching complaint summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------- VIEW COMPLAINTS --------------------
userApp.get("/view-complaints/:userId", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const complaints = await complaintsCollectionObj
    .find({ user_id: userId })
    .sort({ timestamp: -1 })
    .toArray();

  const counts = {
    pending: complaints.filter((c) => c.status === "Pending").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
    ongoing: complaints.filter((c) => c.status === "Ongoing").length,
  };

  res.status(200).json({ complaints, counts });
}));

// -------------------- EDIT COMPLAINT --------------------
  userApp.put(
    "/edit-complaint/:complaint_id",
    verifyGoogleToken,
    asyncHandler(async (req, res) => {
      const { complaint_id } = req.params;
      const { title, description, category, image, room_number, internet_speed, mobile_number, issue_duration } = req.body;

      if (!complaint_id) return res.status(400).json({ message: "Complaint ID is required." });
      
      // Validate required fields are not empty
      const trimmedTitle = title ? title.trim() : "";
      const trimmedDescription = description ? description.trim() : "";
      
      if (!trimmedTitle || !trimmedDescription) {
        return res.status(400).json({ message: "Title and description are required fields and cannot be empty. Please fill them before saving." });
      }    const existingComplaint = await complaintsCollectionObj.findOne({ complaint_id });
    if (!existingComplaint) return res.status(404).json({ message: "Complaint not found." });

    const result = sentiment.analyze(description);
    if (result.score < -3 || containsOffensiveLanguage(description)) {
      return res.status(400).json({
        message: "Your complaint contains offensive or abusive language. Please revise it.",
      });
    }

    if (isMeaninglessComplaint(title) || isMeaninglessComplaint(description)) {
      return res.status(400).json({
        message: "Your complaint seems meaningless. Please provide a valid title and description.",
      });
    }

    // Build update document
    const updateFields = { title, description, category, image };

    // Determine if category is IT (same normalization as add-complaint)
    const normalizedCategory = typeof category === "string" ? category.trim().toLowerCase() : "";
    const isITCategory = [
      "it and networking",
      "it & networking",
      "it networking",
      "it/networking",
    ].includes(normalizedCategory);

    const updateDoc = { $set: updateFields };

    if (isITCategory) {
      updateDoc.$set = {
        ...updateDoc.$set,
        it_details: {
          room_number: room_number || existingComplaint.it_details?.room_number || null,
          internet_speed: internet_speed || existingComplaint.it_details?.internet_speed || null,
          mobile_number: mobile_number || existingComplaint.it_details?.mobile_number || null,
          issue_duration: issue_duration || existingComplaint.it_details?.issue_duration || null,
        },
      };
    } else {
      // If category changed away from IT, remove any existing it_details
      if (existingComplaint.it_details) {
        updateDoc.$unset = { it_details: "" };
      }
    }

    const updateResult = await complaintsCollectionObj.updateOne(
      { complaint_id },
      updateDoc
    );

    if (updateResult.modifiedCount === 0) return res.status(400).json({ message: "No changes made." });

    const updatedComplaint = await complaintsCollectionObj.findOne({ complaint_id });

    res.status(200).json({
      message: "Complaint updated successfully.",
      complaint: updatedComplaint,
    });
  })
);

userApp.delete("/delete-complaint/:complaint_id", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaint_id } = req.params;
  const userEmail = req.user.email;

  const complaint = await complaintsCollectionObj.findOne({ complaint_id });
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });
  if (complaint.user_id !== userEmail) return res.status(403).json({ message: "Unauthorized" });

  const deleteResult = await complaintsCollectionObj.deleteOne({ complaint_id });
  if (deleteResult.deletedCount === 0) return res.status(500).json({ message: "Failed to delete complaint" });

  res.status(200).json({ message: "Complaint deleted successfully" });
}));


// -------------------- MY COMPLAINTS (ANONYMOUS) --------------------
userApp.get(
  "/my-complaints/:user_id",
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const userId = req.params.user_id;

    const complaints = await complaintsCollectionObj
      .find({ user_id: userId })
      .project({ user_id: 0 }) // 👈 ensures user_id excluded
      .sort({ timestamp: -1 })
      .toArray();

    const counts = {
      pending: complaints.filter((c) => c.status === "Pending").length,
      resolved: complaints.filter((c) => c.status === "Resolved").length,
      ongoing: complaints.filter((c) => c.status === "Ongoing").length,
    };

    res.status(200).json({ complaints, counts });
  })
);




// -------------------- LIKE COMPLAINT --------------------
userApp.post("/like-complaint/:complaint_id", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaint_id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "User email is required" });

  const complaint = await complaintsCollectionObj.findOne({ complaint_id });
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });

  let votedUsers = Array.isArray(complaint.votedUsers) ? complaint.votedUsers : [];
  const existingVoteIndex = votedUsers.findIndex((user) => user.email === email);
  let updateQuery = {};

  if (existingVoteIndex !== -1) {
    if (votedUsers[existingVoteIndex].vote === "upvote") {
      updateQuery = { $inc: { likes: -1 }, $pull: { votedUsers: { email } } };
    } else {
      votedUsers[existingVoteIndex].vote = "upvote";
      updateQuery = { $inc: { likes: 1, dislikes: -1 }, $set: { votedUsers } };
    }
  } else {
    updateQuery = { $inc: { likes: 1 }, $push: { votedUsers: { email, vote: "upvote" } } };
  }

  await complaintsCollectionObj.updateOne({ complaint_id }, updateQuery);
  res.status(200).json({ message: "Like updated successfully" });
}));

// -------------------- DISLIKE COMPLAINT --------------------
userApp.post("/dislike-complaint/:complaint_id", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaint_id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "User email is required" });

  const complaint = await complaintsCollectionObj.findOne({ complaint_id });
  if (!complaint) return res.status(404).json({ message: "Complaint not found" });

  let votedUsers = Array.isArray(complaint.votedUsers) ? complaint.votedUsers : [];
  const existingVoteIndex = votedUsers.findIndex((user) => user.email === email);
  let updateQuery = {};

  if (existingVoteIndex !== -1) {
    if (votedUsers[existingVoteIndex].vote === "downvote") {
      updateQuery = { $inc: { dislikes: -1 }, $pull: { votedUsers: { email } } };
    } else {
      votedUsers[existingVoteIndex].vote = "downvote";
      updateQuery = { $inc: { likes: -1, dislikes: 1 }, $set: { votedUsers } };
    }
  } else {
    updateQuery = { $inc: { dislikes: 1 }, $push: { votedUsers: { email, vote: "downvote" } } };
  }

  await complaintsCollectionObj.updateOne({ complaint_id }, updateQuery);
  res.status(200).json({ message: "Dislike updated successfully" });
}));

// -------------------- DATE RANGE HELPER --------------------
function getDateRange(dateRange) {
  const now = new Date();
  let startDate, endDate;

  if (dateRange === "weekly") {
    startDate = new Date(now.setDate(now.getDate() - now.getDay()));
    endDate = new Date(now.setDate(now.getDate() + 6));
  } else if (dateRange === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    return null;
  }

  return { startDate, endDate };
}

// -------------------- FILTER COMPLAINTS --------------------
userApp.get(
  "/filter-complaints",
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const { category, status, dateRange, searchKeyword } = req.query;
    const userEmail = req.user.email; // ✅ Extract from token (verifyGoogleToken adds this)
    let query = {};

    if (searchKeyword) query.$text = { $search: searchKeyword };
    if (category) query.category = category;
    if (status) query.status = status;
    if (dateRange) {
      const { startDate, endDate } = getDateRange(dateRange);
      if (startDate && endDate) query.timestamp = { $gte: startDate, $lte: endDate };
    }

    // Fetch all complaints but exclude large votedUsers data
    const complaints = await complaintsCollectionObj
      .find(query)
      .sort({ timestamp: -1 })
      .toArray();

    // ✅ Add `userVote` field for the logged-in user
    const complaintsWithUserVote = complaints.map((complaint) => {
      let userVote = null;
      if (Array.isArray(complaint.votedUsers)) {
        const voteObj = complaint.votedUsers.find(v => v.email === userEmail);
        if (voteObj) userVote = voteObj.vote;
      }

      // Remove the votedUsers field before sending to frontend
      const { votedUsers, user_id, ...rest } = complaint;

      return {
        ...rest,
        userVote, // 👈 Add this field so frontend can know if the user upvoted or downvoted
      };
    });

    res.status(200).json({ complaints: complaintsWithUserVote });
  })
);

// -------------------- REOPEN COMPLAINT --------------------
userApp.post(
  "/reopen-complaint/:complaint_id",
  verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const { complaint_id } = req.params;
    const { text, userEmail } = req.body;

    if (!complaint_id || !text || !userEmail) {
      return res.status(400).json({
        message: "Complaint ID, comment text, and user email are required",
      });
    }

    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length < 5) {
      return res.status(400).json({
        message: "Comment must be at least 5 characters long",
      });
    }

    // Sentiment and meaningfulness checks
    const result = sentiment.analyze(trimmedText);
    if (result.score < -3 || containsOffensiveLanguage(trimmedText)) {
      return res.status(400).json({
        message: "Your comment contains offensive language. Please revise it.",
      });
    }

    if (isMeaninglessComplaint(trimmedText)) {
      return res.status(400).json({
        message: "Your comment seems meaningless. Please provide valid text.",
      });
    }

    try {
      // Create comment object with role and timestamp
      const newComment = {
        id: new Date().getTime(),
        text: trimmedText,
        role: "student", // Student comment
        timestamp: new Date().toISOString(),
      };

      // Update complaint: add comment, change status to Reopened, update lastCommentAt
      const updateResult = await complaintsCollectionObj.updateOne(
        { complaint_id },
        {
          $push: { comments: newComment },
          $set: {
            status: "Reopened",
            lastCommentAt: new Date().toISOString(),
          },
        }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(404).json({
          message: "Complaint not found or could not be reopened",
        });
      }

      // Fetch updated complaint for notification
      const complaint = await complaintsCollectionObj.findOne({ complaint_id });

      res.status(200).json({
        message: "Complaint reopened successfully",
        complaint,
      });

      // Send notification email to admins of this category asynchronously
      setImmediate(async () => {
        try {
          const admins = await adminsCollectionObj
            .find({ category: complaint.category })
            .toArray();

          if (admins.length > 0) {
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_PASS,
              },
            });

            const adminEmails = admins.map((a) => a.email).join(", ");
            const mailOptions = {
              from: process.env.ADMIN_EMAIL,
              to: adminEmails,
              subject: `Request #${complaint.title} Reopened - Action Required`,
              html: `
                <p>Dear Admin Team,</p>
                <p>A resolved request has been reopened by the student.</p>
                <p><strong>Complaint Details:</strong></p>
                <ul>
                  <li><strong>Title:</strong> ${complaint.title}</li>
                  <li><strong>Request ID:</strong> ${complaint_id}</li>
                  <li><strong>Request ID:</strong> ${complaint.description}</li>
                  <li><strong>Category:</strong> ${complaint.category}</li>
                  <li><strong>Status:</strong> Reopened</li>
                  <li><strong>Student Comment:</strong> ${trimmedText}</li>
                  <li><strong>Reopened on:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p>Please review the updated request and take necessary action.</p>
                <p>Best regards,<br>Thrive</p>
              `,
            };

            transporter.sendMail(mailOptions, (err) => {
              if (err) {
                console.error("❌ Error sending reopen email:", err);
              } else {
                console.log("✅ Reopen notification sent to admins");
              }
            });
          }
        } catch (err) {
          console.error("⚠️ Error in reopen notification:", err);
        }
      });
    } catch (error) {
      console.error("Error reopening complaint:", error);
      res.status(500).json({ message: "Server error" });
    }
  })
);

// -------------------- EXPORT --------------------
module.exports = userApp;
