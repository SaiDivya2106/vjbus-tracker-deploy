const exp = require("express");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const axios = require("axios");
const bodyParser = require("body-parser");
const Sentiment = require("sentiment"); // ✅ Correct import
const natural = require("natural");
const validWords = new Set(require("an-array-of-english-words"));
const sentiment = new Sentiment(); // ✅ Initialize Sentiment instance
const nodemailer=require("nodemailer");
const verifyGoogleToken = require("../Middleware/verifyGoogleToken");



const { isComplaintRelevant } = require('../utils/aiUtils');



dotenv.config(); // Load environment variables

const userApp = exp.Router();
userApp.use(exp.json()); // Middleware to parse JSON

let complaintsCollectionObj;
let adminsCollectionObj;

// Middleware to get the collection object from the app
userApp.use((req, res, next) => {
    complaintsCollectionObj = req.app.get("complaintsCollectionObj");
    adminsCollectionObj= req.app.get('adminsCollectionObj');
    next();
});

// Function to check for offensive language
function containsOffensiveLanguage(text) {
  const offensiveWords = ["offensive", "abusive", "hate", "stupid"];
  return offensiveWords.some((word) => text.toLowerCase().includes(word));
}

// Function to check for meaningless complaints
function isMeaninglessComplaint(text) {
  const tokenizer = new natural.WordTokenizer();
  const words = tokenizer.tokenize(text.toLowerCase());

  const meaningfulWords = words.filter(
    (word) => validWords.has(word) && !natural.stopwords.includes(word)
  );

  return meaningfulWords.length < 2;
}

userApp.post(
  "/add-complaint",verifyGoogleToken,
  asyncHandler(async (req, res) => {
    const { complaint_id, title, description, category, user_id, github_issue } = req.body;

    // Validate required fields
    if (!complaint_id || !title || !description || !category || !user_id) {
      return res.status(400).json({
        message: "Complaint ID, title, description, category, and user ID are required",
      });
    }




    // Analyze sentiment
    const result = sentiment.analyze(description);

    // Check for offensive language or highly negative sentiment
    if (result.score < -3 || containsOffensiveLanguage(description)) {
      return res.status(400).json({
        message: "Your complaint contains offensive or abusive language. Please revise it.",
        score: result.score,
      });
    }

    // Check for meaningless complaints
    if (isMeaninglessComplaint(description)) {
      return res.status(400).json({
        message: "Your complaint seems meaningless. Please provide a valid complaint.",
      });
    }

    const newComplaint = {
      complaint_id,
      title,
      description,
      category,
      user_id,
      github_issue: github_issue || null,
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      status: "Pending",
      comments: [],
      flagged: false,
      votedUsers: [],
    };

    try {
      const result = await complaintsCollectionObj.insertOne(newComplaint);
    

      if (result.acknowledged) {
        // Format timestamp for email
        const formattedTimestamp = new Date(newComplaint.timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "long",
          timeStyle: "short",
        });
      
        // Fetch admins assigned to the complaint category
        // const admins = await adminsCollectionObj.find({ category }).toArray();
      
        // if (admins.length > 0) {
        //   const transporter = nodemailer.createTransport({
        //     service: "gmail",
        //     auth: {
        //       user: process.env.ADMIN_EMAIL,
        //       pass: process.env.ADMIN_PASS,
        //     },
        //   });
        //   const mailPromises = admins.map((admin) => {
        //     const mailOptions = {
        //       from: process.env.EMAIL,
        //       to: admin.email,
        //       subject: `New Complaint in ${category}`,
        //       html: `
        //         <p>Dear Admin,</p>
        //         <p>A new complaint has been submitted in your assigned category: <strong>${category}</strong>.</p>
            
        //         <p><strong>Complaint Details:</strong></p>
        //         <ul>
        //           <li><strong>Title:</strong> ${title}</li>
        //           <li><strong>Description:</strong> ${description}</li>
        //           <li><strong>Complaint ID:</strong> ${complaint_id}</li>
        //           <li><strong>Status:</strong> Pending</li>
        //           <li><strong>Submitted on:</strong> ${formattedTimestamp}</li>
        //         </ul>
            
        //         <p><a href="https://complaints.vjstartup.com">View and manage the complaint</a></p>
            
        //         <p>Please take action as soon as possible.</p>
        //         <p>Regards,<br>Complaint Management System</p>
        //       `,
        //     };
        //     return transporter.sendMail(mailOptions);
        //   });
      
        //   await Promise.all(mailPromises); // Wait for all emails to send
        // }
      
        // res.status(201).json({
        //   message: "Complaint added successfully and email sent to admin(s)",
        //   complaint: newComplaint,
        // });






const admins = await adminsCollectionObj.find({ category }).toArray();

if (admins.length > 0) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL, // email from which mails will be sent
      pass: process.env.ADMIN_PASS,  // app password (not normal password)
    },
  });

  // Send email to each admin in that category
  const mailPromises = admins.map((admin) => {
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,  // must match transporter user
      to: admin.email,                // each admin email
      subject: `New Complaint in ${category}`,
      html: `
        <p>Dear Admin,</p>
        <p>A new complaint has been submitted in your assigned category: <strong>${category}</strong>.</p>
    
        <p><strong>Complaint Details:</strong></p>
        <ul>
          <li><strong>Title:</strong> ${title}</li>
          <li><strong>Description:</strong> ${description}</li>
          <li><strong>Complaint ID:</strong> ${complaint_id}</li>
          <li><strong>Status:</strong> Pending</li>
          <li><strong>Submitted on:</strong> ${formattedTimestamp}</li>
        </ul>
    
        <p><a href="https://complaints.vjstartup.com">View and manage the complaint</a></p>
    
        <p>Please take action as soon as possible.</p>
        <p>Regards,<br>Complaint Management System</p>
      `,
    };

    return transporter.sendMail(mailOptions);
  });

  await Promise.all(mailPromises); // ensures all admins get the email
}

res.status(201).json({
  message: "Complaint added successfully and email sent to all admins in category",
  complaint: newComplaint,
});

      }
      else {
        res.status(500).json({ message: "Failed to add complaint" });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Database error or email error" });
    }
  })
  
);



//GET Complaints Summary
userApp.get("/complaints/summary",verifyGoogleToken, async (req, res) => {
  try {
    // ✅ Fix: Add .toArray() to get actual documents
    const allComplaints = await complaintsCollectionObj.find().toArray();

    const summary = {
      total: allComplaints.length,
      resolved: 0,
      pending: 0,
      ongoing: 0,
      categories: {},
      topCategory: null
    };

    allComplaints.forEach((comp) => {
      const status = comp.status;
      const category = comp.category;

      // Increment status counters
      if (status === "Resolved") summary.resolved++;
      else if (status === "Pending") summary.pending++;
      else if (status === "Ongoing") summary.ongoing++;

      // Initialize category if not exists
      if (!summary.categories[category]) {
        summary.categories[category] = {
          category,
          total: 0,
          resolved: 0,
          pending: 0,
          ongoing: 0,
          resolvedPercentage: 0
        };
      }

      // Update category counts
      summary.categories[category].total++;
      summary.categories[category][status.toLowerCase()]++;
    });

    // Calculate resolved percentage for each category
    Object.values(summary.categories).forEach((cat) => {
      if (cat.total > 0) {
        cat.resolvedPercentage = Math.round((cat.resolved / cat.total) * 100);
      }
    });

    // Find top performing category based on resolved percentage
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


  

// GET API to fetch complaints of a specific user and count of pending, resolved, and ongoing complaints
userApp.get("/view-complaints/:userId",verifyGoogleToken, asyncHandler(async (req, res) => {
  const { userId } = req.params; // Get the userId from the URL parameter

  // Fetch the complaints of the specific user
  const complaints = await complaintsCollectionObj
    .find({ user_id: userId }) // Filter by userId
    .sort({ timestamp: -1 }) // Sort by timestamp in descending order (most recent first)
    .toArray();

  // Count complaints by status
  const counts = {
    pending: complaints.filter(complaint => complaint.status === 'Pending').length,
    resolved: complaints.filter(complaint => complaint.status === 'Resolved').length,
    ongoing: complaints.filter(complaint => complaint.status === 'Ongoing').length
  };

  res.status(200).json({
    complaints,
    counts
  });
}));


//To fetch Users Complaints

userApp.get("/my-complaints/:user_id",verifyGoogleToken, asyncHandler(async (req, res) => {
  const userId = req.params.user_id; // Extract user_id from request parameters

  const userComplaints = await complaintsCollectionObj
      .find({ user_id: userId }) // Filter complaints by user_id
      .sort({ timestamp: -1 }) // Sort by timestamp (most recent first)
      .toArray();

  res.status(200).json({ complaints: userComplaints });
}));



// POST API to like a complaint
userApp.post("/like-complaint/:complaint_id", verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaint_id } = req.params;
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: "User email is required" });
  }

  const complaint = await complaintsCollectionObj.findOne({ complaint_id });

  if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
  }

  let votedUsers = Array.isArray(complaint.votedUsers) ? complaint.votedUsers : [];
  const existingVoteIndex = votedUsers.findIndex(user => user.email === email);

  let updateQuery = {};

  if (existingVoteIndex !== -1) {
      if (votedUsers[existingVoteIndex].vote === "upvote") {
          // User already liked, so remove like
          updateQuery = {
              $inc: { likes: -1 },
              $pull: { votedUsers: { email } }
          };
      } else {
          // User previously disliked, switch to like
          updateQuery = {
              $inc: { likes: 1, dislikes: -1 },
              $set: { [`votedUsers.${existingVoteIndex}.vote`]: "upvote" }
          };
      }
  } else {
      // First-time like
      updateQuery = {
          $inc: { likes: 1 },
          $push: { votedUsers: { email, vote: "upvote" } }
      };
  }

  await complaintsCollectionObj.updateOne({ complaint_id }, updateQuery);

  res.status(200).json({ message: "Like updated successfully" });
}));

userApp.post("/dislike-complaint/:complaint_id",verifyGoogleToken, asyncHandler(async (req, res) => {
  const { complaint_id } = req.params;
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: "User email is required" });
  }

  const complaint = await complaintsCollectionObj.findOne({ complaint_id });

  if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
  }

  let votedUsers = Array.isArray(complaint.votedUsers) ? complaint.votedUsers : [];
  const existingVoteIndex = votedUsers.findIndex(user => user.email === email);

  let updateQuery = {};

  if (existingVoteIndex !== -1) {
      if (votedUsers[existingVoteIndex].vote === "downvote") {
          // User already disliked, so remove dislike
          updateQuery = {
              $inc: { dislikes: -1 },
              $pull: { votedUsers: { email } }
          };
      } else {
          // User previously liked, switch to dislike
          updateQuery = {
              $inc: { likes: -1, dislikes: 1 },
              $set: { [`votedUsers.${existingVoteIndex}.vote`]: "downvote" }
          };
      }
  } else {
      // First-time dislike
      updateQuery = {
          $inc: { dislikes: 1 },
          $push: { votedUsers: { email, vote: "downvote" } }
      };
  }

  await complaintsCollectionObj.updateOne({ complaint_id }, updateQuery);

  res.status(200).json({ message: "Dislike updated successfully" });
}));

// Helper function to get the start and end of the week or month
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

// GET API to filter complaints with text-based search
userApp.get("/filter-complaints",verifyGoogleToken, asyncHandler(async (req, res) => {
  const { category, status, dateRange, searchKeyword } = req.query;
  let query = {};

  if (searchKeyword) query.$text = { $search: searchKeyword };
  if (category) query.category = category;
  if (status) query.status = status;
  if (dateRange) {
      const { startDate, endDate } = getDateRange(dateRange);
      if (startDate && endDate) query.timestamp = { $gte: startDate, $lte: endDate };
  }

  const complaints = await complaintsCollectionObj.find(query).sort({ timestamp: -1 }).toArray();
  res.status(200).json({ complaints });
}));
module.exports = userApp;