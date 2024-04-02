using System;
using System.Collections.Generic;

namespace StretchScheduler.Models
{
    public class Year
    {
        public int Id { get; set; }
        public required int YearNumber { get; set; }

        public Year(int yearNumber)
        {
            YearNumber = yearNumber;
        }
    }
}
