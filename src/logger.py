import logging
import sys
import colorlog


def _init_logger():
    logger = logging.getLogger('bot')
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.DEBUG)

        formatter = colorlog.ColoredFormatter(
            "%(log_color)s%(asctime)s | %(levelname)-8s | %(message)s",
            datefmt="%H:%M:%S",
            reset=True,
            log_colors={
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'black,bg_red',
            },
            secondary_log_colors={},
            style='%'
        )

        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


app_logger = _init_logger()
