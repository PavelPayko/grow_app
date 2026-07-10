const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.endsWith('.xlsx')

    if (!allowed) {
      return cb(new Error('Допустим только формат .xlsx'))
    }

    cb(null, true)
  },
})

module.exports = { upload }
