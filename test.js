const Event = require('./models/eventModel');

const userIdToDelete = '6585967c630b8648a2f16c35';

Event.updateMany(
    { 'listusers.user.userid': userIdToDelete },
    { $pull: { 'listusers.user': { userid: userIdToDelete } } },
    { timeout: false } // Disable the timeout
  )
  .then(result => {
    console.log(`Successfully removed user from ${result.nModified} events.`);
  })
  .catch(err => {
    console.error(err);
  });
  