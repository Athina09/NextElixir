from forecastiq.data.schema import UNIFIED_COLUMNS, UNIFIED_DTYPES, Channel


def test_unified_columns_and_dtypes_are_in_sync():
    assert set(UNIFIED_COLUMNS) == set(UNIFIED_DTYPES.keys())
    assert len(UNIFIED_COLUMNS) == len(set(UNIFIED_COLUMNS))


def test_channel_enum_matches_the_three_ad_platforms_in_scope():
    assert {c.value for c in Channel} == {"Google Ads", "Meta Ads", "Microsoft Ads"}
