﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Mvc;

namespace AtomicChessPuzzles.Controllers
{
    public class PuzzleController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
