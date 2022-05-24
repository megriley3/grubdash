const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res){
  res.json({data: orders})
}

function dataBodyHas(propertyName){
  return function(req, res, next){
    const {data} = req.body;
    if(data[propertyName]){
      return next()
    }
    if(propertyName === "dishes"){
      return next({status: 400, message: `Order must include a dish`});
    }
    next({status: 400, message: `Order must include a ${propertyName}`});
  }
}

function validDishArray(req, res, next){
  const {data: {dishes}} = req.body;
  if(Array.isArray(dishes) && dishes.length){
    return next()
  }
  next({status: 400, message: `Order must include at least one dish`})
}

function validDishQuantity(req, res, next){
  const {data: {dishes}} = req.body;
  dishes.forEach((dish, index) => {
    const {quantity} = dish;
    if( !quantity || quantity <= 0 || !Number.isInteger(quantity)){
      return next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
      };
  });
  next();
}

function create(req, res){
  const {data: {deliverTo, mobileNumber, status, dishes}} = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes
  }
  orders.push(newOrder);
  res.status(201).json({data: newOrder})
}

function orderExists(req, res, next){
  const {orderId} = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if(foundOrder){
    res.locals.order = foundOrder;
    next()
  }
  next({status: 404, message: `Order id not found: ${orderId}`})
}

function read(req, res){
  const order = res.locals.order;
  res.json({data: order})
}

function idMatch(req, res, next){
  const {data: {id}} = req.body;
  const {orderId} = req.params;
  if(id && id != orderId){
    return next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`})
  }
  next()
}

function validStatus(req, res, next){
  const {data: {status}} = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if(!validStatus.includes(status)){
    return next({status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`})
  }
  if(status === "delivered"){
    return next({status: 400, message: `A delivered order cannot be changed`})
  }
  next()
}

function update(req, res){
  const order = res.locals.order;
  const {data: {deliverTo, mobileNumber, dishes, status}} = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  order.status = status;
  res.json({data: order});
}

function pendingStatus(req, res, next){
  const {status} = res.locals.order;
  if(status != "pending"){
    return next({status: 400, message: `An order cannot be deleted unless it is pending`});
  }
  next()
}

function destroy(req, res){
  const {orderId} = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [dataBodyHas("deliverTo"),
           dataBodyHas("mobileNumber"),
           dataBodyHas("dishes"),
           validDishArray,
           validDishQuantity,
           create
  ],
  read: [orderExists, read],
  update: [orderExists,
          dataBodyHas("deliverTo"),
          dataBodyHas("mobileNumber"),
          dataBodyHas("dishes"),
          dataBodyHas("status"),
          validDishArray,
          validDishQuantity,
          idMatch,
          validStatus,
          update],
  delete: [orderExists,
          pendingStatus,
          destroy]
}
