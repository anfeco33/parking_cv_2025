const router = require('express').Router();
const express = require('express');
const Vehicle = require('../models/vehicle.model');

router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ time: -1 });
    res.render('index', { user: req.user, vehicles });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).send('An error occurred while fetching vehicles');
  }
});

module.exports = router;
