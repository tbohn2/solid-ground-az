namespace StretchScheduler.Models
{
    public class ApptType
    {
        public int Id { get; set; }
        public required bool Private { get; set; }
        public required string Name { get; set; }
        public required int Duration { get; set; }
        public required int Price { get; set; }
        public required string ShortDescription { get; set; }
        public required string Description { get; set; }
        public string? LocationName { get; set; }
        public string? LocationAddress { get; set; }
        public string? ImgURL { get; set; }
        public required Guid AdminId { get; set; }
    }
};