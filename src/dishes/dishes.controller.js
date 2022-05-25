const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");


function list (req, res){
  res.json({data: dishes})
}

function validName(req, res, next){
    const {data: {name} = {}} = req.body;
    if(name){
      return next();
    } 
    next({status: 400, message: `Dish must include a name`});
  
}

function validDescription(req, res, next){
  const {data: {description}} = req.body;
  if(description){
    return next();
  } 
  next({status: 400, message: `Dish must include a description`});

}

function validPrice(req, res, next){
  const {data: {price}} = req.body;
  if(price && price >= 0 && Number.isInteger(price)){
    return next();
  }
  next({status: 400, message: `Dish must have a price that is an integer greater than 0`})
}

function validImageUrl(req, res, next){
  const {data: {image_url}} = req.body;
  if(image_url){
    return next();
  } 
  next({status: 400, message: `Dish must include an image_url`});

}

function create(req, res){
  const {data: {name, description, price, image_url} ={}} = req.body;
  const dish = {
    id: nextId(), 
    name,
    description,
    price,
    image_url    
  }
  dishes.push(dish);
  res.status(201).json({data: dish});
}

function dishExists(req, res, next){
  const {dishId} = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if(foundDish){
    res.locals.dish = foundDish;
    next();
  }
  next({status: 404, message: `Dish does not exist: ${dishId}`});
}

function read(req, res){
  const dish = res.locals.dish;
  res.json({data: dish});
}

function idMatch(req, res, next){
  const {data: {id}} = req.body;
  const {dishId} = req.params;
  if(id && id != dishId){
    next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`})
  }
  next();
}

function update(req, res){
  const dish = res.locals.dish;
  const {data: {name, description, price, image_url}} = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({data: dish});
}

module.exports = {
  list,
  create: [validName,
           validDescription,
           validImageUrl,
           validPrice,
           create],
  read: [dishExists, read],
  update: [dishExists,
          validName,
          validDescription,
          validImageUrl,
          validPrice,
          idMatch,
          update
          ],
}
