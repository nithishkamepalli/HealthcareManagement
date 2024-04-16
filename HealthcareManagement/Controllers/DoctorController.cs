using Dapper;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

using Model = HealthcareManagement.Models.DoctorModel;

namespace HealthcareManagement.Controllers;

[ApiController]
[Route("[controller]")]
public class DoctorController : ControllerBase
{
    private readonly NpgsqlConnection connection;

    public DoctorController(IConfiguration _configuration)
    {
        string connectionString = _configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        this.connection = new NpgsqlConnection(connectionString);
    }

    ~DoctorController()
    {
        if(this.connection != null)
        {
            this.connection.Close();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var query = @"SELECT * FROM ""Doctor"" ";
        var records = await connection.QueryAsync<Model>(query);
        return Ok(records);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        return await this.GetByIdHelper(id);
    }

    private async Task<IActionResult> GetByIdHelper(int id)
    {
        var query = @$"SELECT * FROM ""Doctor"" WHERE ""DoctorId"" = {id}";
        var record = await connection.QuerySingleAsync<Model>(query);
        return Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Model model)
    {
        var query = $@"INSERT INTO ""Doctor"" (""Name"", ""Specialty"", ""Phone"")
                        VALUES ('{model.Name}', '{model.Specialty}', '{model.Phone}')
                        RETURNING ""DoctorId""";
        var newId = await this.connection.ExecuteScalarAsync(query);
        return await this.GetByIdHelper((int)newId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Model model)
    {
        var query = $@"UPDATE ""Doctor"" SET ""Name"" = '{model.Name}', ""Specialty"" = '{model.Specialty}',
                        ""Phone"" = '{model.Phone}' WHERE ""DoctorId"" = {id} ";
        var updatedCount = await this.connection.ExecuteAsync(query);
        return Ok(updatedCount);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var query = $@"DELETE FROM ""Doctor"" WHERE ""DoctorId"" = {id} ";
        var deletedCount = await this.connection.ExecuteAsync(query);
        return Ok(deletedCount);
    }
}

