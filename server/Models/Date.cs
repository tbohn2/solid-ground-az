using System;

namespace StretchScheduler.Models
{
    public class Date
    {
        public int Id { get; set; }
        public int DateNumber { get; set; }
        public List<Time> Times { get; set; }
        public int MonthId { get; set; } 
        public Month Month { get; set; }   
    }
}