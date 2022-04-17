//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { request } = require("express");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-venkatesh:Test123@cluster0.mnacy.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name : "Excercise"
});

const item2 = new Item({
  name : "Homework"
});

const item3 = new Item({
  name : "Cooking"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list",listSchema);

app.get("/", function(req, res) {

  Item.find({},function(err, foundItems){

    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems,function(err){
        if(err)
        {
          console.log(err);
        }
        else
        {
          console.log("Successfully saved items to db.");
        }
      });
      res.redirect("/");
    }
    else
    {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if(!err)
    {
      if(!foundList)
      {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName); 
      }
      else
      {
        // show existing list

        res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });

  console.log(listName);
  if(listName === "Today")
  {
    item.save();
    res.redirect("/");
  }
  else
  {
    List.findOne({name: listName}, function(err, foundList){
      if(err)
      {
        console.log(err);
      }
      else
      {
        if(foundList)
        {
          console.log(foundList);
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        }
        else
        {
          console.log("list not found");
        }
      }
      
    });
  }

});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(!err)
      {
        console.log("successfully deleted checked item.");
        res.redirect("/");
      }
    });
  }
  else
  {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err)
      {
        res.redirect("/" + listName);
      }
    });
  }
  
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
