using ClickBurger.DTOs;
using ClickBurger.Validation;
using FluentValidation;

namespace ClickBurger.Tests;

public class ValidationTests
{
    public ValidationTests()
    {
        ValidatorOptions.Global.LanguageManager.Culture = new System.Globalization.CultureInfo("en");
    }

    [Fact]
    public void OrderCreateDtoValidator_requires_items()
    {
        var v = new OrderCreateDtoValidator();
        var r = v.Validate(new OrderCreateDto { TableId = "507f1f77bcf86cd799439011", TableNumber = 1, Items = new List<OrderItemDto>() });
        Assert.False(r.IsValid);
    }

    [Fact]
    public void RegisterRequestValidator_rejects_short_password()
    {
        var v = new RegisterRequestValidator();
        var r = v.Validate(new RegisterRequest { Username = "ab", Email = "a@b.com", Password = "123" });
        Assert.False(r.IsValid);
    }

    [Fact]
    public void MenuItemDtoValidator_accepts_valid()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = "Burger",
            Description = "Test",
            Price = 10,
            Category = "Principal"
        });
        Assert.True(r.IsValid);
    }

    [Fact]
    public void MenuItemDtoValidator_rejects_empty_name()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = "",
            Description = "Test",
            Price = 10,
            Category = "Principal"
        });
        Assert.False(r.IsValid);
        Assert.Contains("'Name' must not be empty.", r.Errors.Select(e => e.ErrorMessage));
    }

    [Fact]
    public void MenuItemDtoValidator_rejects_long_name()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = new string('a', 201),
            Description = "Test",
            Price = 10,
            Category = "Principal"
        });
        Assert.False(r.IsValid);
        Assert.Contains("The length of 'Name' must be 200 characters or fewer. You entered 201 characters.", r.Errors.Select(e => e.ErrorMessage));
    }

    [Fact]
    public void MenuItemDtoValidator_rejects_long_description()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = "Burger",
            Description = new string('a', 2001),
            Price = 10,
            Category = "Principal"
        });
        Assert.False(r.IsValid);
        Assert.Contains("The length of 'Description' must be 2000 characters or fewer. You entered 2001 characters.", r.Errors.Select(e => e.ErrorMessage));
    }

    [Fact]
    public void MenuItemDtoValidator_rejects_negative_price()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = "Burger",
            Description = "Test",
            Price = -1,
            Category = "Principal"
        });
        Assert.False(r.IsValid);
        Assert.Contains("'Price' must be greater than or equal to '0'.", r.Errors.Select(e => e.ErrorMessage));
    }

    [Fact]
    public void MenuItemDtoValidator_rejects_empty_category()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = "Burger",
            Description = "Test",
            Price = 10,
            Category = ""
        });
        Assert.False(r.IsValid);
        Assert.Contains("'Category' must not be empty.", r.Errors.Select(e => e.ErrorMessage));
    }

    [Fact]
    public void MenuItemDtoValidator_rejects_long_category()
    {
        var v = new MenuItemDtoValidator();
        var r = v.Validate(new MenuItemDto
        {
            Name = "Burger",
            Description = "Test",
            Price = 10,
            Category = new string('a', 101)
        });
        Assert.False(r.IsValid);
        Assert.Contains("The length of 'Category' must be 100 characters or fewer. You entered 101 characters.", r.Errors.Select(e => e.ErrorMessage));
    }
}
