package ru.peoplestreasure.peoples_treasure

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.result.ActivityResultLauncher
import com.yandex.authsdk.YandexAuthLoginOptions
import com.yandex.authsdk.YandexAuthOptions
import com.yandex.authsdk.YandexAuthResult
import com.yandex.authsdk.YandexAuthSdk
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.FileInputStream
import java.security.MessageDigest

class MainActivity : FlutterFragmentActivity() {
    private lateinit var yandexAuthSdk: YandexAuthSdk
    private lateinit var yandexAuthLauncher: ActivityResultLauncher<YandexAuthLoginOptions>
    private var pendingYandexResult: MethodChannel.Result? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        yandexAuthSdk = YandexAuthSdk.create(YandexAuthOptions(this))
        yandexAuthLauncher = registerForActivityResult(yandexAuthSdk.contract) { authResult ->
            val result = pendingYandexResult ?: return@registerForActivityResult
            pendingYandexResult = null
            when (authResult) {
                is YandexAuthResult.Success -> result.success(authResult.token.value)
                is YandexAuthResult.Failure -> result.error(
                    "YANDEX_AUTH_FAILED",
                    authResult.exception.message ?: "Яндекс отклонил авторизацию",
                    null,
                )
                YandexAuthResult.Cancelled -> result.error(
                    "YANDEX_AUTH_CANCELLED",
                    "Вход через Яндекс отменён",
                    null,
                )
            }
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            YANDEX_AUTH_CHANNEL,
        ).setMethodCallHandler { call, result ->
            if (call.method != "signIn") {
                result.notImplemented()
                return@setMethodCallHandler
            }
            if (pendingYandexResult != null) {
                result.error(
                    "YANDEX_AUTH_IN_PROGRESS",
                    "Вход через Яндекс уже выполняется",
                    null,
                )
                return@setMethodCallHandler
            }
            pendingYandexResult = result
            yandexAuthLauncher.launch(YandexAuthLoginOptions())
        }

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            APP_UPDATE_CHANNEL,
        ).setMethodCallHandler { call, result ->
            when (call.method) {
                "getInstalledSha256" -> installedSha256(result)
                "openDownload" -> {
                    val url = call.argument<String>("url")
                    if (url == null || (!url.startsWith("https://") && !url.startsWith("http://"))) {
                        result.error("INVALID_DOWNLOAD_URL", "Некорректная ссылка обновления", null)
                        return@setMethodCallHandler
                    }
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun installedSha256(result: MethodChannel.Result) {
        Thread {
            try {
                val digest = MessageDigest.getInstance("SHA-256")
                FileInputStream(applicationInfo.sourceDir).use { input ->
                    val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
                    while (true) {
                        val read = input.read(buffer)
                        if (read < 0) break
                        digest.update(buffer, 0, read)
                    }
                }
                val hash = digest.digest().joinToString("") { "%02x".format(it) }
                runOnUiThread { result.success(hash) }
            } catch (error: Exception) {
                runOnUiThread {
                    result.error(
                        "APP_HASH_FAILED",
                        "Не удалось проверить установленное приложение",
                        error.message,
                    )
                }
            }
        }.start()
    }

    companion object {
        private const val YANDEX_AUTH_CHANNEL = "ru.peoplestreasure/yandex_auth"
        private const val APP_UPDATE_CHANNEL = "ru.peoplestreasure/app_update"
    }
}
