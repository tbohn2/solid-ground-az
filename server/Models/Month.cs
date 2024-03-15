using System;

namespace StretchScheduler.Models
{
    public class Month
    {
        public int Id { get; set; }
        public int MonthNumber { get; set; }
        public string Name { get; set; }
        public List<Date> Dates { get; set; }
        public int YearId { get; set; } // Foreign key
        public Year Year { get; set; }   // Navigation property
    }
}
