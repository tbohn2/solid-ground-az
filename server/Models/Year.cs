using System;
using System.Collections.Generic;

namespace StretchScheduler.Models
{
    public class Year
    {
        public int Id { get; set; }
        public required int YearNumber { get; set; }
        public List<Month>? Months { get; set; }
    }
}
