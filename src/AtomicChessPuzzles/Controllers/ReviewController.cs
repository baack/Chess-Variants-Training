using AtomicChessPuzzles.DbRepositories;
using AtomicChessPuzzles.HttpErrors;
using AtomicChessPuzzles.Models;
using Microsoft.AspNet.Mvc;
using Microsoft.AspNet.Mvc.Filters;
using Microsoft.AspNet.Http;
using System.Collections.Generic;

namespace AtomicChessPuzzles.Controllers
{
    public class ReviewController : ErrorCapableController
    {
        IPuzzleRepository puzzleRepository;
        IUserRepository userRepository;
        const string NEEDS_REVIEWER_ROLE = "You need to be logged in and have at least the Puzzle Reviewer role to be able to review puzzles.";

        public ReviewController(IPuzzleRepository _puzzleRepository, IUserRepository _userRepository)
        {
            puzzleRepository = _puzzleRepository;
            userRepository = _userRepository;
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            string userId = context.HttpContext.Session.GetString("userid");
            if (userId == null)
            {
                context.Result = ViewResultForHttpError(context.HttpContext, new Forbidden(NEEDS_REVIEWER_ROLE));
                return;
            }
            User user = userRepository.FindByUsername(userId);
            bool authorized = UserRole.HasAtLeastThePrivilegesOf(user.Roles, UserRole.PUZZLE_REVIEWER);
            if (!authorized)
            {
                context.Result = ViewResultForHttpError(context.HttpContext, new Forbidden(NEEDS_REVIEWER_ROLE));
                return;
            }
            base.OnActionExecuting(context);
        }

        [Route("/Review")]
        public IActionResult Index()
        {
            List<Puzzle> inReview = puzzleRepository.InReview();
            return View(inReview);
        }

        [HttpPost]
        [Route("/Review/Approve/{id}")]
        public IActionResult Approve(string id)
        {
            if (puzzleRepository.Approve(id))
            {
                return Json(new { success = true });
            }
            else
            {
                return Json(new { success = false, error = "Approval failed." });
            }
        }

        [HttpPost]
        [Route("/Review/Reject/{id}")]
        public IActionResult Reject(string id)
        {
            if (puzzleRepository.Reject(id))
            {
                return Json(new { success = true });
            }
            else
            {
                return Json(new { success = false, error = "Rejection failed." });
            }
        }
    }
}