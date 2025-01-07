const router = require('express').Router();
const express = require('express');
const Vehicle = require('../models/vehicle.model');

router.get('/', async (req, res) => {
  const vehicles = await Vehicle.find().sort({ time: -1 });
  res.render('index', { user: req.user, vehicles });
});

module.exports = router;
