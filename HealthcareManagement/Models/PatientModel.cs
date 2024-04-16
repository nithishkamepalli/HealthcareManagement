namespace HealthcareManagement.Models
{
	public class PatientModel
	{
        public int? PatientId { get; set; }
        public string Name { get; set; }
        public string Gender { get; set; }
        public string Address { get; set; }
        public string Phone { get; set; }
        public DateTime DateOfBirth { get; set; }
    }
}

