const express = require('express');
const {
  getCommunications,
  getCommunication,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  draftEmail,
} = require('../controllers/communicationController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Re-route into other resource routers
router.use('/customers/:customerId/communications', (req, res, next) => {
  req.params.customerId = req.params.customerId;
  next();
}, getCommunications);

router.route('/')
  .get(getCommunications)
  .post(createCommunication);

router.post('/draft-email', draftEmail);

router.route('/:id')
  .get(getCommunication)
  .put(updateCommunication)
  .delete(deleteCommunication);

module.exports = router;