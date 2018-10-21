const { APIContracts, APIControllers } = require('authorizenet');
const transactionsEvents = require('../events');
const Meeting = require('../../models/Meeting');

function initialize() {
  let merchant = new APIContracts.MerchantAuthenticationType();
  merchant.setName(process.env.AUTHORIZE_NET_API_LOGIN_ID);
  merchant.setTransactionKey(process.env.AUTHORIZE_NET_TRANSACTION_KEY);

  return merchant;
}

function createCreditCard(cardNumber, expirationDate, cardCode) {
  let creditCard = new APIContracts.CreditCardType();
  creditCard.setCardNumber(String(cardNumber));
  creditCard.setExpirationDate(String(expirationDate));
  if (cardCode) creditCard.setCardCode(String(cardCode));
  let paymentType = new APIContracts.PaymentType();
  paymentType.setCreditCard(creditCard);

  return paymentType;
}

function createBankAccount(name, routingNum, accountNum) {
  var bankAccountType = new APIContracts.BankAccountType();
  bankAccountType.setAccountType(APIContracts.BankAccountTypeEnum.SAVINGS);
  bankAccountType.setRoutingNumber(routingNum);
  //added code
  bankAccountType.setAccountNumber(accountNum);
  bankAccountType.setNameOnAccount(name);
  let paymentType = new APIContracts.PaymentType();
  paymentType.setBankAccount(bankAccountType);

  return paymentType;
}

function createAddress(firstName, lastName, address, city, state, zip, country, phoneNumber) {
  let customerAddress = new APIContracts.CustomerAddressType();
  customerAddress.setFirstName(String(firstName));
  customerAddress.setLastName(String(lastName));
  customerAddress.setAddress(String(address));
  customerAddress.setCity(String(city));
  customerAddress.setState(String(state));
  customerAddress.setZip(String(zip));
  customerAddress.setCountry(String(country));
  customerAddress.setPhoneNumber(String(phoneNumber));

  return customerAddress;
}

function createPaymentProfile(paymentType, address) {
  let customerPaymentProfile = new APIContracts.CustomerPaymentProfileType();
  customerPaymentProfile.setCustomerType(APIContracts.CustomerTypeEnum.INDIVIDUAL);
  customerPaymentProfile.setPayment(paymentType);
  customerPaymentProfile.setBillTo(address);
  return customerPaymentProfile;
}

function PayMentor(transactionId, paymentType, mentor) {
  var orderDetails = new APIContracts.OrderType();
  orderDetails.setInvoiceNumber('MEETING-NUM', String(Math.floor(Math.random() * 9999999999) + 10000));
  orderDetails.setDescription('You have been paid for helping someone develop their skills!');

  var transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.REFUNDTRANSACTION);
  transactionRequestType.setPayment(paymentType);
  transactionRequestType.setRefTransId(transactionId);
  transactionRequestType.setAmount(mentor.rate);
  transactionRequestType.setOrder(orderDetails);

  var createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(initialize());
  createRequest.setTransactionRequest(transactionRequestType);

  //pretty print request

  var ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

  ctrl.execute(function() {
    var apiResponse = ctrl.getResponse();

    var response = new APIContracts.CreateTransactionResponse(apiResponse);

    transactionsEvents.emit('mentorPayed', response);
  });
}
function createProfile(paymentProfile, user) {
  let customerProfile = new APIContracts.CustomerProfileType();
  customerProfile.setMerchantCustomerId(user);
  customerProfile.setEmail(user.email);
  customerProfile.setPaymentProfiles([paymentProfile]);
  let request = new APIContracts.CreateCustomerProfileRequest();
  request.setProfile(customerProfile);
  request.setValidationMode(APIContracts.ValidationModeEnum.TESTMODE);
  request.setMerchantAuthentication(initialize());

  var ctrl = new APIControllers.CreateCustomerProfileController(request.getJSON());

  ctrl.execute(function() {
    var apiResponse = ctrl.getResponse();

    var response = new APIContracts.CreateCustomerProfileResponse(apiResponse);
    transactionsEvents.emit('userProfileCompleted', response);
    //pretty print response
    //console.log(JSON.stringify(response, null, 2));
  });
}

function authorizeTransaction(paymentType, address, meeting) {
  console.log(meeting);
  let merchant = initialize();
  let transaction = new APIContracts.TransactionRequestType();
  transaction.setTransactionType(APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION);
  transaction.setPayment(paymentType);
  transaction.setAmount(11.0);
  transaction.setBillTo(address);

  var createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchant);
  createRequest.setTransactionRequest(transaction);

  var ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
  ctrl.execute(function() {
    var apiResponse = ctrl.getResponse();

    var response = new APIContracts.CreateTransactionResponse(apiResponse);
    let resp = response.getJSON();
    console.log(JSON.stringify(resp));
    let transactionId = parseInt(response.transactionResponse.transId);
    if (transactionId !== 0) {
      Meeting.findByIdAndUpdate(meeting._id, { transactionID: transactionId }).exec();
    }
  });
}

function createLineItem(meeting_id, mentor_rate) {
  var lineItem_id1 = new APIContracts.LineItemType();
  lineItem_id1.setItemId(meeting_id);
  lineItem_id1.setName('Meeting with a Mentor');
  lineItem_id1.setDescription('Cost of per meeting with this mentor amounted to');
  lineItem_id1.setQuantity('1');
  lineItem_id1.setUnitPrice(mentor_rate);
}

function chargePreviousTransaction(transaction_id, meeting, student) {
  let test = 0;
  return test;
}

function getProfile(user_id) {
  let merchant = initialize();
  let request = new APIContracts.GetCustomerProfileRequest();
  request.setCustomerProfileId(String(user_id));
  request.setMerchantAuthentication(merchant);

  let control = new APIControllers.GetCustomerProfileController(request.getJSON());
  let apiResponse = control.getResponse();
  let response = new APIContracts.GetCustomerProfileResponse(apiResponse);

  return response.getJSON();
}

function deleteProfile(user_id) {
  let merchant = initialize();
  let request = new APIContracts.DeleteCustomerProfileRequest();
  request.setCustomerProfileId(user_id);
  request.setMerchantAuthentication(merchant);

  let control = new APIControllers.DeleteCustomerProfileController(request.getJSON());
  let response = new APIContracts.DeleteCustomerProfileResponse(control.getResponse());

  return response.getJSON();
}

function getProfileIds() {
  let merchant = initialize();
  let request = new APIContracts.GetCustomerProfileIdsRequest();
  request.setMerchantAuthentication(merchant);

  let controller = new APIControllers.GetCustomerProfileIdsController(request.getJSON());
  let response = new APIContracts.GetCustomerProfileIdsResponse(controller.getResponse());

  return response.getJSON();
}

module.exports = {
  authorizeTransaction,
  createCreditCard,
  createAddress,
  createPaymentProfile,
  createProfile,
  getProfile,
  deleteProfile,
  getProfileIds,
  PayMentor,
  createBankAccount,
  chargePreviousTransaction,
  createLineItem,
};
