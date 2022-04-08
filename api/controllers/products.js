const mongoose = require("mongoose");
const Product = require("../models/product");
require("dotenv").config();
const cloudinary = require("cloudinary").v2;

exports.getAllProducts = (req, res, next) => {
  let filter = {
    price: {
      $lte: 9999999999,
      $gte: 0,
    },
  };
  if (!isNaN(req.query.max)) {
    filter.price["$lte"] = req.query.max;
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (!isNaN(req.query.min)) {
    filter.price["$gte"] = req.query.min;
  }

  console.log(req.query.min);
  console.log(filter);

  let q = Product.find(filter);
  q.populate("category")
    // .select('_id name price')
    .exec()
    .then((products) => {
      const response = {
        count: products.length,
        products: products.map((product) => {
          return {
            _id: product._id,
            name: product.name,
            price: product.price,
            category: product.category,
            productImage: product.productImage,
          };
        }),
      };
      res.status(200).json(response);
    })
    .catch((error) => {
      next(error);
    });
};

exports.createOneProduct = async (req, res, next) => {
  console.log(req.file);
  const response = await cloudinary.uploader.upload(req.file.path);
  const product = createProduct(req, response.url);
  console.log(req.body);

  product
    .save()
    .then((product) => {
      res.status(200).json({
        message: "Product Created Successfully!",
        product: {
          _id: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          productImage: product.productImage,
        },
      });
    })
    .catch((error) => {
      next(error);
    });
};

exports.getOneProduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .select("_id name price productImage category")
    .populate("category")
    .exec()
    .then((product) => {
      if (product) {
        res.status(200).json(product);
      } else {
        res.status(404).json({
          message: "Product Not Found!",
        });
      }
    })
    .catch((error) => {
      next(error);
    });
};

exports.updateOneProduct = (req, res, next) => {
  const productId = req.params.productId;
  // const updateOps = {};
  // for (const prop of req.body) {
  // 	updateOps[prop.propName] = prop.propValue;
  // }

  Product.update({ _id: productId }, { $set: req.body })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Updated Product Successfully!",
        result: result,
      });
    })
    .catch((error) => {
      next(error);
    });
};

exports.deleteOneProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.remove({ _id: productId })
    .exec()
    .then((result) => {
      res.status(200).json({
        message: "Deleted Product Successfully!",
        result: result,
      });
    })
    .catch((error) => {
      next(error);
    });
};

function createProduct(req, imageUrl) {
  return new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    category: req.body.category,
    productImage: imageUrl,
  });
}

exports.productCount = () => {
  return Product.aggregate([
    {
      $count: "productCount",
    },
  ]).then((r) => {
    return r[0].productCount;
  });
};
