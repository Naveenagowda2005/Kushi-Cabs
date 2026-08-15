# Document Upload Status - Visual Guide

## Status Indicators

### 1. Not Uploaded (Initial State)
```
┌─────────────────────────────────────┐
│ 📄 Driver License                   │
│    Not Uploaded (gray)              │
│                                     │
│    [📤 Upload]                      │
└─────────────────────────────────────┘
```
- Icon: Document outline (gray)
- Status: "Not Uploaded"
- Button: "Upload" (blue)
- Action: Click to upload

### 2. Uploaded - Pending Review
```
┌─────────────────────────────────────┐
│ ✓ Driver License                    │
│    Uploaded - Pending Review (🟠)   │
│                                     │
│    [✓ Uploaded]                     │
└─────────────────────────────────────┘
```
- Icon: Checkmark circle (green)
- Status: "Uploaded - Pending Review" (orange)
- Button: "Uploaded" (green checkmark)
- Action: Can view or re-upload
- Progress: 1/6 documents

### 3. Approved by Admin
```
┌─────────────────────────────────────┐
│ ✓ Driver License                    │
│    Approved ✓ (🟢)                  │
│                                     │
│    [✓ Approved]                     │
└─────────────────────────────────────┘
```
- Icon: Checkmark circle (green)
- Status: "Approved ✓" (green)
- Button: "Approved" (disabled)
- Action: None (approved)

### 4. Rejected by Admin
```
┌─────────────────────────────────────┐
│ ✗ Driver License                    │
│    Rejected ✗ (🔴)                  │
│                                     │
│ ⚠️ Image quality is poor             │
│                                     │
│    [🔄 Re-upload]                   │
└─────────────────────────────────────┘
```
- Icon: Close circle (red)
- Status: "Rejected ✗" (red)
- Shows rejection reason
- Button: "Re-upload" (blue)
- Action: Upload new image

## Color Coding

| Status | Color | Meaning |
|--------|-------|---------|
| Not Uploaded | Gray/Blue | Needs action |
| Uploaded | Green | Successfully uploaded |
| Approved | Green | Admin approved |
| Rejected | Red | Needs re-upload |
| Pending Review | Orange | Waiting for admin |

## Progress Tracking

```
Upload Progress:
┌─────────────────────────────────────┐
│ Verification Progress: 3/6          │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                     │
│ ✓ Approved: 0                       │
│ ⏳ Pending: 3                        │
│ ✗ Rejected: 0                       │
└─────────────────────────────────────┘
```

## Complete Upload Flow

```
Step 1: Initial
┌─────────────────────────────────────┐
│ 📄 DL          [Upload]             │
│ 📄 Vehicle     [Upload]             │
│ 📄 Insurance   [Upload]             │
│ 📄 FC          [Upload]             │
│ 📄 Emission    [Upload]             │
│ 📄 RC          [Upload]             │
│ Progress: 0/6                       │
└─────────────────────────────────────┘

Step 2: After Uploading 3 Documents
┌─────────────────────────────────────┐
│ ✓ DL           [Uploaded]           │
│ ✓ Vehicle      [Uploaded]           │
│ ✓ Insurance    [Uploaded]           │
│ 📄 FC          [Upload]             │
│ 📄 Emission    [Upload]             │
│ 📄 RC          [Upload]             │
│ Progress: 3/6                       │
└─────────────────────────────────────┘

Step 3: All Documents Uploaded
┌─────────────────────────────────────┐
│ ✓ DL           [Uploaded]           │
│ ✓ Vehicle      [Uploaded]           │
│ ✓ Insurance    [Uploaded]           │
│ ✓ FC           [Uploaded]           │
│ ✓ Emission     [Uploaded]           │
│ ✓ RC           [Uploaded]           │
│ Progress: 6/6                       │
│                                     │
│ [Submit for Verification]           │
└─────────────────────────────────────┘

Step 4: After Admin Approval
┌─────────────────────────────────────┐
│ ✓ DL           [Approved]           │
│ ✓ Vehicle      [Approved]           │
│ ✓ Insurance    [Approved]           │
│ ✓ FC           [Approved]           │
│ ✓ Emission     [Approved]           │
│ ✓ RC           [Approved]           │
│ Progress: 6/6 - All Approved        │
│                                     │
│ ✓ All documents approved!           │
│ You can now login                   │
└─────────────────────────────────────┘
```

## User Actions by Status

### Not Uploaded
- Click "Upload" button
- Choose Camera or Gallery
- Select/take image
- Wait for upload

### Uploaded - Pending Review
- View document (click card)
- Re-upload if needed
- Wait for admin review
- Cannot submit until all uploaded

### Approved
- View document
- No further action needed
- Can proceed to login

### Rejected
- Read rejection reason
- Click "Re-upload"
- Choose new image
- Upload again

## Key Improvements

✅ **Clear Status**: Users know exactly what state each document is in
✅ **Visual Feedback**: Color coding makes status obvious
✅ **Progress Tracking**: See how many documents are uploaded
✅ **Action Buttons**: Clear what to do next
✅ **No Confusion**: Can't mistake "Uploaded" for "Not Uploaded"

## Testing Checklist

- [ ] Not Uploaded state shows correctly
- [ ] After upload, status changes to "Uploaded"
- [ ] Button shows "Uploaded" with checkmark
- [ ] Icon changes to green
- [ ] Progress bar updates
- [ ] Can upload all 6 documents
- [ ] Admin approval changes status to "Approved"
- [ ] Rejected documents show reason
- [ ] Can re-upload rejected documents

---

**Status**: Ready to test
**Next Action**: Upload a document and verify feedback
