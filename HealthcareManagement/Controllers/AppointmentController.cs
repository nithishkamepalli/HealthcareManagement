using Dapper;
using HealthcareManagement.Models;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

using Model = HealthcareManagement.Models.AppointmentModel;

namespace HealthcareManagement.Controllers;

[ApiController]
[Route("[controller]")]
public class AppointmentController : ControllerBase
{
    private readonly NpgsqlConnection connection;

    public AppointmentController(IConfiguration _configuration)
    {
        string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        this.connection = new NpgsqlConnection(connectionString);
    }

    ~AppointmentController()
    {
        if(this.connection != null)
        {
            this.connection.Close();
        }
    }

    [HttpPost("filter")]
    public async Task<IActionResult> GetAll([FromBody] AppointmentFilterModel model)
    {
        var where = "WHERE 1 = 1";

        if(!string.IsNullOrEmpty(model.PatientName))
        {
            where += $@" AND p.""Name"" like '%{model.PatientName}%' ";
        }

        if (!string.IsNullOrEmpty(model.DoctorName))
        {
            where += $@" AND d.""Name"" like '%{model.DoctorName}%' ";
        }

        if (model.AppointmentDate != null)
        {
            where += $@" AND a.""AppointmentDate"" = '{model.AppointmentDate?.Date}' ";
        }

        if(model.AppointmentId != null)
        {
            where += @$" AND a.""AppointmentId"" = {model.AppointmentId} ";
        }

        var query = @$"SELECT a.*, p.""PatientId"", p.""Name"" AS ""PatientName"", d.""DoctorId"", d.""Name"" AS ""DoctorName""  FROM ""Appointment"" a
                        JOIN ""Patient"" p on p.""PatientId"" = a.""PatientId""
                        JOIN ""Doctor"" d on d.""DoctorId"" = a.""DoctorId"" {where} ";
        var records = await connection.QueryAsync<AppointmentFetchModel>(query);
        return Ok(records);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        return await this.GetByIdHelper(id);
    }

    private async Task<IActionResult> GetByIdHelper(int id)
    {
        var query = @$"SELECT * FROM ""Appointment"" WHERE ""AppointmentId"" = {id}";
        var record = await connection.QuerySingleAsync<Model>(query);
        return Ok(record);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] Model model)
    {
        var query = $@"INSERT INTO ""Appointment"" (""PatientId"", ""DoctorId"", ""AppointmentDate"", ""AppointmentTime"", ""Notes"")
                        VALUES ({model.PatientId}, {model.DoctorId}, '{model.AppointmentDate.Date}',
                        '{model.AppointmentTime}', '{model.Notes}')
                        RETURNING ""AppointmentId""";
        var newId = await this.connection.ExecuteScalarAsync(query);
        return await this.GetByIdHelper((int)newId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Model model)
    {
        var query = $@"UPDATE ""Appointment"" SET ""DoctorId"" = '{model.DoctorId}', ""PatientId"" = '{model.PatientId}',
                        ""AppointmentDate"" = '{model.AppointmentDate.Date}', ""AppointmentTime"" = '{model.AppointmentTime}',
                        ""Notes"" = '{model.Notes}' WHERE ""AppointmentId"" = {id} ";
        var updatedCount = await this.connection.ExecuteAsync(query);
        return Ok(updatedCount);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var query = $@"DELETE FROM ""Appointment"" WHERE ""AppointmentId"" = {id} ";
        var deletedCount = await this.connection.ExecuteAsync(query);
        return Ok(deletedCount);
    }
}

