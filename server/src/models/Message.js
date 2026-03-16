const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    image: {
      url: String,
      publicId: String,
    },
    content: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.pre("validate", function validateMessage(next) {
  const hasContent = Boolean(this.content && this.content.trim());
  const hasImage = Boolean(this.image?.url);

  if (!hasContent && !hasImage) {
    this.invalidate("content", "Message content or image is required");
  }

  next();
});

module.exports = mongoose.model("Message", messageSchema);
