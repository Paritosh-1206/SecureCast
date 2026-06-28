// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getAllUsers,
  approveUser,
  rejectUser,
  changeUserRole,
  getStats,
} = require("../controllers/adminController");

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

router.get("/users", getAllUsers);
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/reject", rejectUser);
router.put("/users/:id/role", changeUserRole);
router.get("/stats", getStats);

module.exports = router;
