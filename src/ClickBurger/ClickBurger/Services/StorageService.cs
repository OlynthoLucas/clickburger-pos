namespace ClickBurger.Services;

public class StorageService
{
    /// <summary>
    /// Simula o upload de imagens em base64 e retorna as URLs resultantes.
    /// </summary>
    /// <param name="base64Imagens">Lista de imagens em formato Base64</param>
    /// <param name="productId">ID do produto associado</param>
    /// <returns>Lista de URLs simuladas</returns>
    public List<string> UploadImages(List<string> base64Imagens, string productId)
    {
        // Aqui seria implementada a lógica real de upload (ex: S3 ou armazenamento local)
        // Por enquanto, retornamos URLs simuladas baseadas no ID do produto.
        return base64Imagens
            .Select((_, index) => $"https://storage.clickburger.com/products/{productId}/image_{index}.jpg")
            .ToList();
    }
}