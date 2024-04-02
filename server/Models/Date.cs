using System;

namespace StretchScheduler.Models
{
    public class Date
    {
        public int Id { get; set; }
        public int DateNumber { get; set; }
        public int MonthNumber { get; set; }
        public required Month Month { get; set; }
    }
}