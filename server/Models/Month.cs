using System;

namespace StretchScheduler.Models
{
    public class Month
    {
        public int Id { get; set; }
        public required int MonthNumber { get; set; }
        public required string Name { get; set; }
        public int YearNumber { get; set; } // Foreign key
        public Year? Year { get; set; }   // Navigation property
    }
}
