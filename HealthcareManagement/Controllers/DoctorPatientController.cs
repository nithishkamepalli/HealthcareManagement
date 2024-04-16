using Dapper;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

using Model = HealthcareManagement.Models.PatientModel;

namespace HealthcareManagement.Controllers;

[ApiController]
[Route("doctor-patient")]
public class DoctorPatientController : ControllerBase
{
    private readonly NpgsqlConnection connection;

    public DoctorPatientController(IConfiguration _configuration)
    {
        string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        this.connection = new NpgsqlConnection(connectionString);
    }

    ~DoctorPatientController()
    {
        if(this.connection != null)
        {
            this.connection.Close();
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var query = @$"SELECT DISTINCT ON (p.""PatientId"") p.* FROM ""Appointment"" a 
                        JOIN ""Patient"" p on p.""PatientId"" = a.""PatientId""
                        WHERE a.""DoctorId"" = {id}";
        var record = await connection.QueryAsync<Model>(query);
        return Ok(record);
    }
}

