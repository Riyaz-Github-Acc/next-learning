import { v2 as cloudinary } from 'cloudinary'

import { app } from '../app/app'

require('dotenv').config()

// * Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
})

// * Server Configuration
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
