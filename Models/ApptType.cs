namespace StretchScheduler.Models
{
    public class ApptType
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required int Duration { get; set; }
        public required int Price { get; set; }
        public required Guid AdminId { get; set; }
        public required string Description { get; set; }
    }
};