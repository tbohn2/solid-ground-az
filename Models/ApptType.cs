namespace StretchScheduler.Models
{
    public class ApptType
    {
        public int Id { get; set; }
        public required bool Private { get; set; }
        public required string Name { get; set; }
        public required int Duration { get; set; }
        public required int Price { get; set; }
        public required string Description { get; set; }
        public string? Location { get; set; }
        public required string ImgURL { get; set; } = "./assets/services1.jpg";
        public required Guid AdminId { get; set; }
    }
};