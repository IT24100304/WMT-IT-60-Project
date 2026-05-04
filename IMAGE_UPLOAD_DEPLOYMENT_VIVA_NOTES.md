# Image Upload, Deployment, and Viva Notes

## Image Upload

The system supports image/file upload by sending the selected file from the frontend/mobile app to the backend using `multipart/form-data`. The backend receives the file using **Multer**, validates it, stores it, and saves the file URL or file reference in MongoDB.

### Upload Room Image / Lab Image

1. The user selects an image from the frontend or mobile app.
2. The frontend sends the image to the backend API using `multipart/form-data`.
3. The backend route uses Multer middleware to read the uploaded file.
4. Multer saves the file into the server upload folder or sends it to cloud storage.
5. The backend saves the image URL or filename in MongoDB.
6. The frontend displays the image using the returned URL.

Example flow:

```txt
Frontend/Mobile App
        ↓
multipart/form-data request
        ↓
Backend API Route
        ↓
Multer Middleware
        ↓
Validate file type and size
        ↓
Store file in server/cloud
        ↓
Save image URL in MongoDB
        ↓
Send URL back to frontend
```

## Multer

Multer is a Node.js middleware used to handle file uploads in Express applications. It can read files from `multipart/form-data` requests and make them available in `req.file` or `req.files`.

Example:

```js
router.post("/upload", upload.single("image"), controllerFunction);
```

For multiple files:

```js
router.post("/upload", upload.array("files", 5), controllerFunction);
```

## File Type and Size Validation

The backend should validate uploaded files before saving them.

Validation includes:

- Allow only supported file types, such as `image/jpeg`, `image/png`, or `application/pdf`.
- Reject unsupported files, such as `.exe` or unknown formats.
- Limit file size, for example 5MB for images or 10MB for PDFs.

Example validation idea:

```js
const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

if (!allowedTypes.includes(file.mimetype)) {
  throw new Error("Invalid file type");
}
```

This protects the system from invalid, large, or unsafe uploads.

## Store in Server or Cloud

Uploaded files can be stored in two ways.

### Server Storage

The backend stores files in a local folder, for example:

```txt
uploads/
```

Then Express serves the folder publicly:

```js
app.use("/uploads", express.static("uploads"));
```

The frontend can access the file using:

```txt
https://backend-url.com/uploads/image-name.jpg
```

Important: on platforms like Render, normal filesystem storage can be temporary. Files may disappear after redeploy or restart unless persistent disk storage is configured.

### Cloud Storage

For production, cloud storage is better.

Examples:

- Cloudinary
- AWS S3
- Firebase Storage

In this method, the backend uploads the file to cloud storage and saves the cloud URL in MongoDB.

Example stored value:

```js
{
  imageUrl: "https://res.cloudinary.com/example/image/upload/room.jpg"
}
```

### Cloudinary Setup Used in This Project

The backend uses Cloudinary when these environment variables are configured:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_FOLDER=lifeline_uploads
```

The upload middleware uses `multer-storage-cloudinary` instead of `multer.diskStorage`. That means files are sent directly to Cloudinary and the database stores the permanent Cloudinary URL.

For lab test uploads, MongoDB stores attachment metadata like:

```js
{
  filename: "lifeline_uploads/sample_public_id",
  publicId: "lifeline_uploads/sample_public_id",
  originalName: "test-report.pdf",
  mimeType: "application/pdf",
  fileSize: 120000,
  fileUrl: "https://res.cloudinary.com/your_account/image/upload/v123/test-report.pdf",
  storageProvider: "cloudinary"
}
```

If Cloudinary variables are missing in local development, the backend can still fall back to local `uploads/` storage. On Render, Cloudinary variables should be configured so uploaded files do not disappear.

## Send Image URL to Frontend

After upload, the backend sends the saved image URL back to the frontend.

Example response:

```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "/uploads/room-123.jpg"
}
```

The frontend uses this URL to display the image:

```js
<Image source={{ uri: imageUrl }} />
```

For a deployed backend, the full URL should include the backend domain:

```txt
https://lifeline-backend-node.onrender.com/uploads/room-123.jpg
```

## Deployment

The backend can be deployed using platforms such as:

- Render
- Railway
- AWS

For this project, Render is used for backend deployment.

## Backend Deployment Steps

1. Push backend code to GitHub.
2. Create a new Web Service in Render.
3. Connect the GitHub repository.
4. Set the root directory if the backend is inside a subfolder.
5. Set the build command:

```bash
npm install
```

6. Set the start command:

```bash
npm start
```

7. Add required environment variables.
8. Deploy the service.
9. Test the live API endpoint in browser or Postman.

## Environment Variables

Environment variables are used to keep sensitive configuration outside the code.

Common backend environment variables:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=https://frontend-url.com
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Why they are important:

- `MONGO_URI` connects the backend to MongoDB Atlas.
- `JWT_SECRET` is used for authentication tokens.
- `CLIENT_URL` controls which frontend can access the backend.
- `PORT` tells the backend which port to run on.
- `CLOUDINARY_*` variables connect the backend to Cloudinary for permanent file uploads.

Never hardcode passwords, database URLs, or secret keys directly in the source code.

## MongoDB Atlas Connection

The deployed backend connects to MongoDB Atlas using the `MONGO_URI` environment variable.

MongoDB Atlas setup checklist:

- Create MongoDB Atlas cluster.
- Create database user.
- Add the password to the connection string.
- Allow network access from deployment platform.
- Add `MONGO_URI` in Render environment variables.
- Confirm backend logs show successful database connection.

## Test Live API Endpoints

After deployment, test important endpoints.

Examples:

```txt
GET https://lifeline-backend-node.onrender.com/api/health
GET https://lifeline-backend-node.onrender.com/api/inventory
POST https://lifeline-backend-node.onrender.com/api/auth/login
```

For upload endpoints, use Postman or the mobile app because they require `multipart/form-data`.

## Viva Focus

### Explain Deployment Steps

In the viva, explain:

- Backend code was pushed to GitHub.
- Render was connected to the GitHub repository.
- Render installs dependencies using `npm install`.
- Render starts the backend using `npm start`.
- Environment variables were configured in the Render dashboard.
- MongoDB Atlas was used as the cloud database.
- Live API endpoints were tested after deployment.

### Explain Environment Config

Environment variables keep sensitive data secure and make the app easier to deploy.

Example answer:

> We do not store the MongoDB URL or JWT secret directly in code. Instead, we add them as environment variables in Render. The backend reads them using `process.env`.

### Explain Image Handling Pipeline

Example viva answer:

> The frontend sends the selected image as `multipart/form-data`. The backend receives it using Multer. Multer validates the file type and size, then stores the file in the upload folder or cloud storage. The backend saves only the file path or URL in MongoDB. When the frontend needs to display the image, it reads the URL from the API response and loads the image from that URL.

For the deployed version:

> We use Cloudinary instead of Render local storage because Render free tier storage can be ephemeral. Multer sends the uploaded file to Cloudinary, Cloudinary returns a permanent CDN URL, and that URL is stored in MongoDB. The frontend opens the Cloudinary URL directly.

## Key Point

Images and PDFs should not usually be stored directly inside MongoDB. MongoDB should store metadata and URLs, while the actual files are stored in server storage or cloud storage.
