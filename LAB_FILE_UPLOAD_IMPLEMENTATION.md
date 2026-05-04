# Lab File Upload Implementation - Lifeline Project

## Overview
This implementation adds comprehensive file upload functionality to the lab testing module, allowing lab technicians to attach test reports, images of positive results, and other supporting documents directly to blood unit records. Admins can then view all lab details by expanding blood units in the inventory.

## Changes Made

### 1. **Upload Middleware** (`src/middleware/uploadMiddleware.js`)
- **Added `labUpload` middleware** specifically for lab test files
- **Supported file types:** Images (JPEG, PNG) and PDFs
- **File size limit:** 10MB per file (for lab reports)
- **Original `upload` middleware** remains unchanged for backward compatibility

```javascript
// Usage in routes
upload.labUpload.array("files", 5) // Accept up to 5 files
```

---

### 2. **Database Model Updates** (`src/models/Inventory.js`)

#### New Schema Fields:

**`fileAttachmentSchema`** - Stores file metadata:
```javascript
{
  filename: String,           // Server-generated filename
  originalName: String,       // Original filename from user
  mimeType: String,           // File type (image/pdf)
  fileSize: Number,           // File size in bytes
  uploadedAt: Date            // Upload timestamp
}
```

**Enhanced `labResultSchema`** with new fields:
- `testTechnician` - Name of lab technician who ran the test
- `attachments` - Array of file attachments (fileAttachmentSchema)
- `positiveDetails` - Details about positive findings:
  - `markerFound[]` - Which disease markers found (HIV, Hepatitis, Malaria)
  - `severity` - Level of severity (LOW, MEDIUM, HIGH)
  - `notes` - Additional notes about positive results

---

### 3. **Controller Updates** (`src/controllers/inventoryController.js`)

#### New Functions:

**`getInventoryDetails(id)`** - Get full inventory details including all lab results
- **Route:** `GET /inventory/:id/details`
- **Returns:** Complete blood unit info with all lab results and attachments

**`uploadLabTestFiles(id)`** - Upload additional files to existing lab test
- **Route:** `POST /inventory/:id/lab-files`
- **Accepts:** Multiple files (images/PDFs)
- **Returns:** List of uploaded files with URLs

**`updateLabPositiveDetails(id)`** - Add/update details about positive findings
- **Route:** `PUT /inventory/:id/positive-details`
- **Body:** `{ markerFound: [...], severity: "...", notes: "..." }`

#### Enhanced Existing Functions:

**`updateLabTest(id)`** - Now accepts file uploads
- Handles multiple file uploads during test creation
- Stores file metadata in `attachments` array
- Records test technician name

**`serializeLabResult()`** - Enhanced serialization
- Now returns file URLs for attachments
- Includes positive details information
- Returns test technician information

---

### 4. **Route Updates** (`src/routes/inventoryRoutes.js`)

| Method | Route | Handler | Auth | Description |
|--------|-------|---------|------|-------------|
| GET | `/` | `getInventory` | ADMIN, LAB | List all blood units |
| GET | `/:id/details` | `getInventoryDetails` | ADMIN, LAB | Get full details (expandable view) |
| GET | `/:id/lab-results` | `getLabResults` | ADMIN, LAB | Get all lab results |
| PUT | `/:id/test` | `updateLabTest` | ADMIN, LAB | Create/update test with files |
| POST | `/:id/lab-files` | `uploadLabTestFiles` | ADMIN, LAB | Add files to existing test |
| PUT | `/:id/positive-details` | `updateLabPositiveDetails` | ADMIN, LAB | Add positive details |
| GET | `/low-stock` | `getLowStockAlerts` | Any | Get low stock alerts |
| POST | `/add` | `addInventory` | ADMIN | Add new blood unit |

---

## API Usage Examples

### 1. Create Lab Test with Files
```bash
POST /api/inventory/:id/test
Content-Type: multipart/form-data

Form Data:
- hiv: false
- hep: true
- malaria: false
- reason: "Hepatitis B marker detected"
- testTechnician: "Dr. John Doe"
- files: [test_report.pdf, sample_image.jpg]
- positiveDetails: {
    markerFound: ["HEPATITIS"],
    severity: "HIGH",
    notes: "Further confirmation needed"
  }
```

**Response:**
```json
{
  "id": "blood_unit_id",
  "testStatus": "TESTED_POSITIVE",
  "safetyFlag": "BIO-HAZARD",
  "labResult": {
    "hiv": false,
    "hep": true,
    "malaria": false,
    "reason": "Hepatitis B marker detected",
    "testTechnician": "Dr. John Doe",
    "overallResult": "TESTED_POSITIVE",
    "positiveMarkers": ["HEPATITIS"],
    "attachments": [
      {
        "filename": "1620000000000-test_report.pdf",
        "originalName": "test_report.pdf",
        "mimeType": "application/pdf",
        "fileSize": 245632,
        "uploadedAt": "2024-05-03T10:30:00Z",
        "fileUrl": "/uploads/1620000000000-test_report.pdf"
      }
    ],
    "positiveDetails": {
      "markerFound": ["HEPATITIS"],
      "severity": "HIGH",
      "notes": "Further confirmation needed"
    }
  }
}
```

### 2. Get Full Inventory Details (Expandable View)
```bash
GET /api/inventory/:id/details
```

**Response:**
```json
{
  "id": "blood_unit_id",
  "bloodType": "B+",
  "quantity": 1,
  "donorName": "John Smith",
  "status": "DISCARD",
  "safetyFlag": "BIO-HAZARD",
  "testStatus": "TESTED_POSITIVE",
  "collectedAt": "2024-05-01T09:00:00Z",
  "createdAt": "2024-05-01T09:00:00Z",
  "updatedAt": "2024-05-03T10:30:00Z",
  "allLabResults": [
    {
      "hiv": false,
      "hep": true,
      "malaria": false,
      "reason": "Hepatitis B marker detected",
      "testTechnician": "Dr. John Doe",
      "overallResult": "TESTED_POSITIVE",
      "positiveMarkers": ["HEPATITIS"],
      "attachments": [
        {
          "filename": "1620000000000-test_report.pdf",
          "originalName": "test_report.pdf",
          "mimeType": "application/pdf",
          "fileSize": 245632,
          "uploadedAt": "2024-05-03T10:30:00Z",
          "fileUrl": "/uploads/1620000000000-test_report.pdf"
        }
      ],
      "positiveDetails": {
        "markerFound": ["HEPATITIS"],
        "severity": "HIGH",
        "notes": "Further confirmation needed"
      }
    }
  ]
}
```

### 3. Upload Additional Files to Existing Test
```bash
POST /api/inventory/:id/lab-files
Content-Type: multipart/form-data

Form Data:
- files: [additional_document.pdf, confirmation_test.jpg]
```

**Response:**
```json
{
  "message": "2 file(s) uploaded successfully",
  "attachments": [
    {
      "filename": "1620000000001-additional_document.pdf",
      "originalName": "additional_document.pdf",
      "mimeType": "application/pdf",
      "fileSize": 512000,
      "fileUrl": "/uploads/1620000000001-additional_document.pdf"
    }
  ]
}
```

### 4. Update Positive Details
```bash
PUT /api/inventory/:id/positive-details

Body:
{
  "markerFound": ["HEPATITIS"],
  "severity": "HIGH",
  "notes": "HIV and Hepatitis B positive. Blood discarded."
}
```

---

## Frontend Integration

### Mobile App (React Native)

**Upload Lab Test with Files:**
```javascript
const uploadLabTest = async (inventoryId, testData, selectedFiles) => {
  const formData = new FormData();
  
  // Add test data
  formData.append('hiv', testData.hiv);
  formData.append('hep', testData.hep);
  formData.append('malaria', testData.malaria);
  formData.append('reason', testData.reason);
  formData.append('testTechnician', testData.testTechnician);
  formData.append('positiveDetails', JSON.stringify(testData.positiveDetails));
  
  // Add files
  selectedFiles.forEach((file, index) => {
    formData.append('files', {
      uri: file.uri,
      type: file.type,
      name: file.name
    });
  });
  
  const response = await fetch(
    `${API_URL}/inventory/${inventoryId}/test`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  
  return response.json();
};
```

**View Expandable Blood Unit Details:**
```javascript
const viewBloodUnitDetails = async (inventoryId) => {
  const response = await fetch(
    `${API_URL}/inventory/${inventoryId}/details`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  // Display all lab results with file attachments
  return data.allLabResults;
};
```

---

## File Storage

- **Location:** `lifeline-backend-deploy/uploads/`
- **File naming:** `{timestamp}-{original_filename}`
- **Example:** `1620000000000-test_report.pdf`
- **Access:** `http://api-url/uploads/{filename}`

---

## Security Considerations

1. **File Type Validation:** Only images and PDFs allowed
2. **File Size Limit:** 10MB per file
3. **Authorization:** Requires ADMIN or LAB role
4. **Activity Logging:** All file uploads are logged
5. **Filename Sanitization:** Spaces in filenames replaced with hyphens

---

## Activity Logging

All file operations are logged:
- **LAB_RESULT:** Test result created/updated
- **LAB_FILE_UPLOAD:** Files uploaded to test
- **LAB_POSITIVE_DETAILS:** Positive details updated

---

## Print Label Generation (Future Enhancement)

The system is prepared to support barcode/label printing with:
- Blood unit ID
- Blood type
- Collection date
- Test status
- QR code linking to full lab details

---

## Testing Checklist

- [ ] Upload test result with single file
- [ ] Upload test result with multiple files
- [ ] Upload files to existing test
- [ ] Update positive details
- [ ] Expand blood unit to view all lab information
- [ ] Verify file URLs are accessible
- [ ] Check activity logs for file uploads
- [ ] Test PDF upload
- [ ] Test image upload
- [ ] Verify file size limits
- [ ] Test authorization (LAB role can access)

---

## Troubleshooting

**Issue:** Files not uploading
- **Solution:** Ensure multipart/form-data header is set

**Issue:** File type error
- **Solution:** Only JPEG, PNG, and PDF files are allowed

**Issue:** File size error
- **Solution:** Maximum file size is 10MB

**Issue:** Attachments not showing
- **Solution:** Ensure `/uploads` route is accessible and files exist on server
