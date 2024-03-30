using System;
using System.Collections.Generic;

namespace StretchScheduler.Models
{
    public class Year(int yearNumber)
    {
        public int Id { get; set; }
        public required int YearNumber { get; set; } = yearNumber;
        public List<Month>? Months { get; set; } = new List<Month>();

        // Method to add a Month to the Year
        public void AddMonth(Month month)
        {
            Months?.Add(month);
        }
    }
}
