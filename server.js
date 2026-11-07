using UnityEngine;
using System.Collections;

public class JpHz : MonoBehaviour
{
    [Header("Hedef Oyuncu")]
    [Tooltip("Inspector'dan Player objesini buraya sürükle.")]
    public GameObject player;

    [Header("1. Küpe Dokunulduğu AN Ne Olsun?")]
    public float touchWalkSpeed = 30f;
    public float touchJumpHeight = 5f;

    [Header("2. Süre Ne Kadar Sürsün?")]
    [Tooltip("Dokunduktan sonra bu süre (saniye) boyunca yukarıdaki değerler geçerli olur.")]
    public float duration = 4f;

    [Header("3. Süre Bittiğinde Ne Olsun?")]
    public float endWalkSpeed = 5f;
    public float endJumpHeight = 1.2f;

    private bool hasTriggered = false;

    private void OnTriggerEnter(Collider other)
    {
        if (!hasTriggered && player != null && other.gameObject == player)
        {
            hasTriggered = true;
            StartCoroutine(HandleBuffSequence());
        }
    }

    IEnumerator HandleBuffSequence()
    {
        SimpleFPSController fpsController = player.GetComponent<SimpleFPSController>();
        if (fpsController == null)
        {
            Debug.LogWarning("Player üzerinde SimpleFPSController bulunamadı!");
            yield break;
        }

        // 1. ADIM: Küpe dokunulduğu anki değerleri hemen uygula
        fpsController.walkSpeed = touchWalkSpeed;
        fpsController.jumpHeight = touchJumpHeight;
        Debug.Log($"AntiPherspective: Küpe dokunuldu! Hız: {touchWalkSpeed}, Zıplama: {touchJumpHeight}");

        // 2. ADIM: Belirlediğin süre boyunca (örn. 4 saniye) bekle
        yield return new WaitForSeconds(duration);

        // 3. ADIM: Süre bittiğinde yeni değerleri uygula
        fpsController.walkSpeed = endWalkSpeed;
        fpsController.jumpHeight = endJumpHeight;
        Debug.Log($"AntiPherspective: Süre bitti! Hız: {endWalkSpeed}, Zıplama: {endJumpHeight}");
    }
}